"""Conversation + Message models — the ChatGPT-style chat history."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ConversationMode, MessageRole

if TYPE_CHECKING:
    from app.models.correction import GrammarCorrection
    from app.models.user import User


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), default="New conversation")
    mode: Mapped[ConversationMode] = mapped_column(
        Enum(ConversationMode, native_enum=False), default=ConversationMode.FREE_TALK
    )
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    avg_overall_score: Mapped[float | None] = mapped_column(Float)

    user: Mapped[User] = relationship(back_populates="conversations")
    messages: Mapped[list[Message]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole, native_enum=False), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Voice metadata (nullable for text-only messages)
    audio_url: Mapped[str | None] = mapped_column(String(500))
    transcript_confidence: Mapped[float | None] = mapped_column(Float)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    correction: Mapped[GrammarCorrection | None] = relationship(
        back_populates="message", uselist=False, cascade="all, delete-orphan"
    )
