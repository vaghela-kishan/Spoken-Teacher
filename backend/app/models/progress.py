"""Aggregated learning progress — one row per user, updated after each session.
Cheap to read for the dashboard without scanning message history."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    total_minutes: Mapped[int] = mapped_column(Integer, default=0)
    total_words_spoken: Mapped[int] = mapped_column(Integer, default=0)
    total_corrections: Mapped[int] = mapped_column(Integer, default=0)

    current_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_practice_date: Mapped[str | None] = mapped_column(String(10))  # YYYY-MM-DD

    # rolling averages (0-100)
    avg_confidence: Mapped[float] = mapped_column(Float, default=0)
    avg_pronunciation: Mapped[float] = mapped_column(Float, default=0)
    avg_fluency: Mapped[float] = mapped_column(Float, default=0)
    avg_grammar: Mapped[float] = mapped_column(Float, default=0)
    avg_overall: Mapped[float] = mapped_column(Float, default=0)

    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)

    user: Mapped[User] = relationship(back_populates="progress")
