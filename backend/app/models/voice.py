"""Voice recording history — one row per spoken utterance the user submits."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class VoiceRecording(Base):
    __tablename__ = "voice_recordings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    conversation_id: Mapped[str | None] = mapped_column(String(36), index=True)

    audio_url: Mapped[str | None] = mapped_column(String(500))
    transcript: Mapped[str] = mapped_column(String(2000), default="")
    duration_seconds: Mapped[float] = mapped_column(Float, default=0)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    stt_confidence: Mapped[float] = mapped_column(Float, default=0)
    overall_score: Mapped[float | None] = mapped_column(Float)

    user: Mapped[User] = relationship(back_populates="recordings")
