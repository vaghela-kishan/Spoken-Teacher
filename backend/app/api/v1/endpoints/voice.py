"""Voice endpoints: server-side transcription (optional) + voice history."""

from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Query, UploadFile
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import ServiceUnavailableError
from app.models.voice import VoiceRecording
from app.schemas.common import Page
from app.schemas.progress import VoiceRecordingRead
from app.services.ai.stt import speech_to_text

router = APIRouter(prefix="/voice", tags=["voice"])


@router.get("/capabilities")
async def capabilities() -> dict[str, bool]:
    """Tell the frontend whether to use server STT/TTS or the browser fallback."""
    from app.services.ai.tts import text_to_speech

    return {"server_stt": speech_to_text.available, "server_tts": text_to_speech.server_side}


@router.post("/transcribe")
async def transcribe(user: CurrentUser, audio: UploadFile = File(...)) -> dict:
    """Transcribe an uploaded audio blob. 503 signals the client to use browser STT."""
    if not speech_to_text.available:
        raise ServiceUnavailableError(
            "Server transcription is not enabled; use browser speech recognition.",
            code="stt_unavailable",
        )
    suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
    tmp = Path(tempfile.gettempdir()) / f"{uuid.uuid4().hex}{suffix}"
    tmp.write_bytes(await audio.read())
    try:
        result = await speech_to_text.transcribe(str(tmp))
    finally:
        tmp.unlink(missing_ok=True)
    return {
        "text": result.text,
        "confidence": result.confidence,
        "duration": result.duration,
    }


@router.get("/history", response_model=Page[VoiceRecordingRead])
async def voice_history(
    user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> Page[VoiceRecordingRead]:
    total = (
        await db.scalar(
            select(func.count(VoiceRecording.id)).where(VoiceRecording.user_id == user.id)
        )
        or 0
    )
    rows = (
        (
            await db.execute(
                select(VoiceRecording)
                .where(VoiceRecording.user_id == user.id)
                .order_by(VoiceRecording.created_at.desc())
                .offset((page - 1) * size)
                .limit(size)
            )
        )
        .scalars()
        .all()
    )
    return Page[VoiceRecordingRead](
        items=[VoiceRecordingRead.model_validate(r) for r in rows],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )
