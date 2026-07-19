"""Current-user profile & settings endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.profile import Profile
from app.models.setting import UserSetting
from app.schemas.common import Message
from app.schemas.user import (
    ChangePasswordRequest,
    ProfileUpdate,
    SettingsRead,
    SettingsUpdate,
    UserRead,
)
from app.services import auth_service

router = APIRouter(prefix="/users", tags=["users"])


async def _ensure_profile(db: DbSession, user_id: str) -> Profile:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user_id))
    if profile is None:
        profile = Profile(user_id=user_id)
        db.add(profile)
        await db.flush()
    return profile


async def _ensure_settings(db: DbSession, user_id: str) -> UserSetting:
    settings_row = await db.scalar(select(UserSetting).where(UserSetting.user_id == user_id))
    if settings_row is None:
        settings_row = UserSetting(user_id=user_id)
        db.add(settings_row)
        await db.flush()
    return settings_row


@router.get("/me", response_model=UserRead)
async def get_profile(user: CurrentUser, db: DbSession) -> UserRead:
    await _ensure_profile(db, user.id)
    await db.refresh(user, ["profile"])
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
async def update_profile(payload: ProfileUpdate, user: CurrentUser, db: DbSession) -> UserRead:
    profile = await _ensure_profile(db, user.id)
    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data and data["full_name"]:
        user.full_name = data.pop("full_name")
    for field, value in data.items():
        setattr(profile, field, value)
    await db.flush()
    await db.refresh(user, ["profile"])
    return UserRead.model_validate(user)


@router.get("/me/settings", response_model=SettingsRead)
async def get_settings(user: CurrentUser, db: DbSession) -> SettingsRead:
    row = await _ensure_settings(db, user.id)
    return SettingsRead.model_validate(row)


@router.patch("/me/settings", response_model=SettingsRead)
async def update_settings(
    payload: SettingsUpdate, user: CurrentUser, db: DbSession
) -> SettingsRead:
    row = await _ensure_settings(db, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    await db.flush()
    return SettingsRead.model_validate(row)


@router.post("/me/change-password", response_model=Message)
async def change_password(
    payload: ChangePasswordRequest, user: CurrentUser, db: DbSession
) -> Message:
    await auth_service.change_password(db, user, payload.current_password, payload.new_password)
    return Message(message="Password changed successfully.")
