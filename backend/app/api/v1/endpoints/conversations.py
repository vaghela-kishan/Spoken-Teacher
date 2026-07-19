"""Conversation & chat endpoints (text turns; voice turns use the WebSocket)."""

from __future__ import annotations

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.models.conversation import Conversation
from app.schemas.common import Message, Page
from app.schemas.conversation import (
    ChatTurnRequest,
    ChatTurnResponse,
    ConversationCreate,
    ConversationDetail,
    ConversationRead,
    MessageRead,
)
from app.services import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationRead, status_code=201)
async def create_conversation(
    payload: ConversationCreate, user: CurrentUser, db: DbSession
) -> ConversationRead:
    convo = await conversation_service.get_or_create_conversation(
        db, user, None, mode=payload.mode, title=payload.title
    )
    return ConversationRead.model_validate(convo)


@router.get("", response_model=Page[ConversationRead])
async def list_conversations(
    user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> Page[ConversationRead]:
    total = (
        await db.scalar(select(func.count(Conversation.id)).where(Conversation.user_id == user.id))
        or 0
    )
    rows = (
        (
            await db.execute(
                select(Conversation)
                .where(Conversation.user_id == user.id)
                .order_by(Conversation.updated_at.desc())
                .offset((page - 1) * size)
                .limit(size)
            )
        )
        .scalars()
        .all()
    )
    return Page[ConversationRead](
        items=[ConversationRead.model_validate(r) for r in rows],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str, user: CurrentUser, db: DbSession
) -> ConversationDetail:
    convo = await conversation_service.get_conversation_detail(db, user, conversation_id)
    return ConversationDetail.model_validate(convo)


@router.delete("/{conversation_id}", response_model=Message)
async def delete_conversation(conversation_id: str, user: CurrentUser, db: DbSession) -> Message:
    convo = await db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user.id
        )
    )
    if convo is None:
        raise NotFoundError("Conversation not found.")
    await db.delete(convo)
    return Message(message="Conversation deleted.")


@router.post("/turn", response_model=ChatTurnResponse)
async def chat_turn(payload: ChatTurnRequest, user: CurrentUser, db: DbSession) -> ChatTurnResponse:
    """Process a single text turn: correction + reply + scores, all persisted."""
    convo = await conversation_service.get_or_create_conversation(
        db, user, payload.conversation_id, mode=payload.mode
    )
    user_msg, assistant_msg, reply, reply_audio = await conversation_service.process_turn(
        db, user, conversation=convo, text=payload.text, seconds=0.0
    )
    return ChatTurnResponse(
        conversation_id=convo.id,
        user_message=MessageRead.model_validate(user_msg),
        assistant_message=MessageRead.model_validate(assistant_msg),
        feedback=reply.feedback,
        reply_audio_url=reply_audio,
    )
