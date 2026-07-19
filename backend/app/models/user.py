"""User account model — the auth root aggregate."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.achievement import UserAchievement
    from app.models.conversation import Conversation
    from app.models.profile import Profile
    from app.models.progress import LearningProgress
    from app.models.setting import UserSetting
    from app.models.stats import DailyStat
    from app.models.voice import VoiceRecording


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(120))

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False), default=UserRole.USER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ---- relationships ----
    profile: Mapped[Profile | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    settings: Mapped[UserSetting | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    conversations: Mapped[list[Conversation]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    recordings: Mapped[list[VoiceRecording]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    progress: Mapped[LearningProgress | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    achievements: Mapped[list[UserAchievement]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    daily_stats: Mapped[list[DailyStat]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User {self.email} ({self.role})>"
