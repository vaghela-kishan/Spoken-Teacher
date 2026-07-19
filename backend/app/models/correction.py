"""Grammar correction + scoring attached to a user message.

Stores the full teacher feedback payload (highlights, tips, native rephrasing)
as JSON alongside the discrete numeric scores that power analytics/progress.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.conversation import Message


class GrammarCorrection(Base):
    __tablename__ = "grammar_corrections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    message_id: Mapped[str] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_text: Mapped[str] = mapped_column(Text, nullable=False)
    native_text: Mapped[str] = mapped_column(Text, nullable=False)

    grammar_explanation: Mapped[str | None] = mapped_column(Text)
    pronunciation_tips: Mapped[str | None] = mapped_column(Text)

    # rich structures: highlighted errors, vocabulary suggestions
    highlights: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    vocabulary_suggestions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)

    # ---- scores (0-100) ----
    confidence_score: Mapped[float] = mapped_column(Float, default=0)
    pronunciation_score: Mapped[float] = mapped_column(Float, default=0)
    fluency_score: Mapped[float] = mapped_column(Float, default=0)
    grammar_score: Mapped[float] = mapped_column(Float, default=0)
    overall_score: Mapped[float] = mapped_column(Float, default=0)

    message: Mapped[Message] = relationship(back_populates="correction")
