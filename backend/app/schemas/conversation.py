"""Conversation, message and chat-turn schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ConversationMode, MessageRole
from app.schemas.common import ORMModel
from app.schemas.tutor import TutorFeedback


class CorrectionRead(ORMModel):
    original_text: str
    corrected_text: str
    native_text: str
    grammar_explanation: str | None = None
    pronunciation_tips: str | None = None
    highlights: list[dict] = Field(default_factory=list)
    vocabulary_suggestions: list[dict] = Field(default_factory=list)
    confidence_score: float
    pronunciation_score: float
    fluency_score: float
    grammar_score: float
    overall_score: float


class MessageRead(ORMModel):
    id: str
    role: MessageRole
    content: str
    audio_url: str | None = None
    transcript_confidence: float | None = None
    created_at: datetime
    correction: CorrectionRead | None = None


class ConversationCreate(BaseModel):
    title: str | None = Field(None, max_length=200)
    mode: ConversationMode = ConversationMode.FREE_TALK


class ConversationRead(ORMModel):
    id: str
    title: str
    mode: ConversationMode
    message_count: int
    duration_seconds: int
    avg_overall_score: float | None = None
    created_at: datetime
    updated_at: datetime


class ConversationDetail(ConversationRead):
    messages: list[MessageRead] = Field(default_factory=list)


class ChatTurnRequest(BaseModel):
    """A text turn (voice turns come over the WebSocket)."""

    conversation_id: str | None = None
    text: str = Field(..., min_length=1, max_length=2000)
    mode: ConversationMode = ConversationMode.FREE_TALK


class ChatTurnResponse(BaseModel):
    conversation_id: str
    user_message: MessageRead
    assistant_message: MessageRead
    feedback: TutorFeedback
    reply_audio_url: str | None = None
