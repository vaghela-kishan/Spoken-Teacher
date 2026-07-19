"""Per-user application settings (theme, voice, notifications, learning prefs)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ThemePreference

if TYPE_CHECKING:
    from app.models.user import User


class UserSetting(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    theme: Mapped[ThemePreference] = mapped_column(
        Enum(ThemePreference, native_enum=False), default=ThemePreference.SYSTEM
    )
    # which teacher character speaks in the voice chat
    avatar_style: Mapped[str] = mapped_column(String(20), default="female")
    tts_voice: Mapped[str] = mapped_column(String(60), default="en_US-amy-medium")
    speech_rate: Mapped[float] = mapped_column(Float, default=1.0)
    auto_play_replies: Mapped[bool] = mapped_column(Boolean, default=True)
    show_corrections_live: Mapped[bool] = mapped_column(Boolean, default=True)
    interrupt_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_time: Mapped[str] = mapped_column(String(5), default="19:00")

    user: Mapped[User] = relationship(back_populates="settings")
