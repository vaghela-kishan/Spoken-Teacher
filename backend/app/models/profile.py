"""Extended user profile — learning-oriented attributes kept separate from the
auth-critical `User` row so it can grow without touching the auth path."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ProficiencyLevel

if TYPE_CHECKING:
    from app.models.user import User


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    native_language: Mapped[str | None] = mapped_column(String(60))
    country: Mapped[str | None] = mapped_column(String(60))
    target_accent: Mapped[str] = mapped_column(String(30), default="us")  # us | uk | au
    proficiency: Mapped[ProficiencyLevel] = mapped_column(
        Enum(ProficiencyLevel, native_enum=False), default=ProficiencyLevel.BEGINNER
    )
    daily_goal_minutes: Mapped[int] = mapped_column(Integer, default=15)

    user: Mapped[User] = relationship(back_populates="profile")
