"""Real-time voice chat WebSocket.

Protocol (JSON frames):

  client → server
    { "type": "user_text", "conversation_id": str|null, "text": str,
      "confidence": float, "seconds": float, "mode": str }
    { "type": "interrupt" }          # cancel the in-flight AI turn
    { "type": "ping" }

  server → client
    { "type": "thinking" }
    { "type": "user_message", "message": {...} }
    { "type": "assistant_message", "message": {...}, "reply_audio_url": str|null }
    { "type": "feedback", "feedback": {...} }
    { "type": "done", "conversation_id": str }
    { "type": "error", "message": str }
    { "type": "pong" }

Transcription happens in the browser (Web Speech API) or via /voice/transcribe;
this socket handles the low-latency turn loop and supports interruption.
"""

from __future__ import annotations

import asyncio
import contextlib
from datetime import UTC, datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import AsyncSessionLocal
from app.core.deps import get_ws_user
from app.core.logging import logger
from app.models.enums import ConversationMode
from app.schemas.conversation import MessageRead
from app.services import conversation_service, presence
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/voice")
async def voice_ws(websocket: WebSocket) -> None:
    user = await get_ws_user(websocket)
    await manager.connect(user.id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await presence.heartbeat(user.id, datetime.now(UTC).timestamp())
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type == "interrupt":
                manager.cancel(websocket)
                await websocket.send_json({"type": "interrupted"})
                continue

            if msg_type == "user_text":
                text = (data.get("text") or "").strip()
                if not text:
                    continue
                # run the turn as a cancellable task so "interrupt" works
                task = asyncio.create_task(_handle_turn(websocket, user, data))
                manager.track(websocket, task)

    except WebSocketDisconnect:
        pass
    except Exception as exc:  # pragma: no cover
        logger.error(f"Voice WS error: {exc}")
    finally:
        manager.disconnect(user.id, websocket)
        # Only go offline once the user's *last* tab/socket has closed.
        if not manager.has_connections(user.id):
            await presence.mark_offline(user.id)


async def _handle_turn(websocket: WebSocket, user, data: dict) -> None:
    try:
        await websocket.send_json({"type": "thinking"})
        async with AsyncSessionLocal() as db:
            # reload user in this session (relationships for proficiency)
            db_user = await db.get(type(user), user.id)
            await db.refresh(db_user, ["profile"])

            mode = ConversationMode(data.get("mode", "free_talk"))
            convo = await conversation_service.get_or_create_conversation(
                db, db_user, data.get("conversation_id"), mode=mode
            )
            user_msg, assistant_msg, reply, reply_audio = await conversation_service.process_turn(
                db,
                db_user,
                conversation=convo,
                text=data["text"].strip(),
                stt_confidence=data.get("confidence"),
                seconds=float(data.get("seconds") or 0),
            )
            await db.commit()

            await websocket.send_json(
                {
                    "type": "user_message",
                    "message": MessageRead.model_validate(user_msg).model_dump(mode="json"),
                }
            )
            await websocket.send_json(
                {"type": "feedback", "feedback": reply.feedback.model_dump(mode="json")}
            )
            await websocket.send_json(
                {
                    "type": "assistant_message",
                    "message": MessageRead.model_validate(assistant_msg).model_dump(mode="json"),
                    "reply_audio_url": reply_audio,
                }
            )
            await websocket.send_json({"type": "done", "conversation_id": convo.id})
    except asyncio.CancelledError:  # interrupted by the user
        logger.debug("Turn cancelled by interrupt.")
    except Exception as exc:  # pragma: no cover
        logger.error(f"Turn failed: {exc}")
        with contextlib.suppress(Exception):
            await websocket.send_json(
                {"type": "error", "message": "Failed to process your speech."}
            )
