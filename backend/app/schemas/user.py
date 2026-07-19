"""User, profile and settings schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import ProficiencyLevel, ThemePreference, UserRole
from app.schemas.common import ORMModel


class ProfileRead(ORMModel):
    avatar_url: str | None = None
    bio: str | None = None
    native_language: str | None = None
    country: str | None = None
    target_accent: str = "us"
    proficiency: ProficiencyLevel = ProficiencyLevel.BEGINNER
    daily_goal_minutes: int = 15


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=120)
    avatar_url: str | None = None
    bio: str | None = Field(None, max_length=500)
    native_language: str | None = None
    country: str | None = None
    target_accent: str | None = None
    proficiency: ProficiencyLevel | None = None
    daily_goal_minutes: int | None = Field(None, ge=5, le=240)


class SettingsRead(ORMModel):
    theme: ThemePreference = ThemePreference.SYSTEM
    avatar_style: str = "female"
    tts_voice: str = "en_US-amy-medium"
    speech_rate: float = 1.0
    auto_play_replies: bool = True
    show_corrections_live: bool = True
    interrupt_enabled: bool = True
    email_notifications: bool = True
    daily_reminder: bool = True
    reminder_time: str = "19:00"


class SettingsUpdate(BaseModel):
    theme: ThemePreference | None = None
    avatar_style: str | None = Field(None, pattern="^(female|male|professor|madam)$")
    tts_voice: str | None = None
    speech_rate: float | None = Field(None, ge=0.5, le=2.0)
    auto_play_replies: bool | None = None
    show_corrections_live: bool | None = None
    interrupt_enabled: bool | None = None
    email_notifications: bool | None = None
    daily_reminder: bool | None = None
    reminder_time: str | None = None


class UserRead(ORMModel):
    id: str
    email: EmailStr
    full_name: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    profile: ProfileRead | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=64)
