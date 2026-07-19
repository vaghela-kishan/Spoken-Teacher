"""Daily statistics roll-up per user. Monthly stats are derived by aggregating
these rows, keeping writes cheap (one upsert per active day)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class DailyStat(Base):
    __tablename__ = "daily_stats"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    date: Mapped[str] = mapped_column(String(10), index=True, nullable=False)  # YYYY-MM-DD

    sessions: Mapped[int] = mapped_column(Integer, default=0)
    minutes: Mapped[int] = mapped_column(Integer, default=0)
    words_spoken: Mapped[int] = mapped_column(Integer, default=0)
    corrections: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    avg_overall: Mapped[float] = mapped_column(Float, default=0)

    user: Mapped[User] = relationship(back_populates="daily_stats")
