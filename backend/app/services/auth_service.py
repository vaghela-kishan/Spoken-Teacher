"""Authentication business logic — framework-agnostic (raises domain errors).

Handles registration (with related profile/settings/progress bootstrap),
credential verification, email verification, and password reset. Endpoints are
thin wrappers that translate the results to HTTP.
"""

from __future__ import annotations

import jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import AuthError, ConflictError, NotFoundError
from app.core.security import (
    TokenType,
    create_access_token,
    create_email_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole
from app.models.profile import Profile
from app.models.progress import LearningProgress
from app.models.setting import UserSetting
from app.models.user import User
from app.schemas.auth import RegisterRequest


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    existing = await db.scalar(select(User).where(User.email == data.email.lower()))
    if existing:
        raise ConflictError("An account with this email already exists.")

    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        role=UserRole.USER,
    )
    # Bootstrap the 1:1 related rows so the dashboard has data from day one.
    user.profile = Profile()
    user.settings = UserSetting()
    user.progress = LearningProgress()
    db.add(user)
    await db.flush()
    # Re-select with the profile eagerly loaded so response serialization
    # never triggers a lazy load outside the async greenlet context.
    loaded = await db.scalar(
        select(User).where(User.id == user.id).options(selectinload(User.profile))
    )
    return loaded or user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await db.scalar(select(User).where(User.email == email.lower()))
    if not user or not verify_password(password, user.hashed_password):
        raise AuthError("Incorrect email or password.")
    if not user.is_active:
        raise AuthError("This account has been disabled.")
    return user


def issue_tokens(user: User) -> tuple[str, str, int]:
    access = create_access_token(user.id, role=user.role.value)
    refresh = create_refresh_token(user.id)
    return access, refresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> tuple[str, int]:
    try:
        payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired refresh token.") from exc
    user = await db.get(User, payload["sub"])
    if not user or not user.is_active:
        raise AuthError("User not found or disabled.")
    return create_access_token(
        user.id, role=user.role.value
    ), settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


async def create_email_verification(user: User) -> str:
    return create_email_token(user.id)


async def verify_email_token(db: AsyncSession, token: str) -> User:
    try:
        payload = decode_token(token, expected_type=TokenType.EMAIL_VERIFY)
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired verification link.") from exc
    user = await db.get(User, payload["sub"])
    if not user:
        raise NotFoundError("User not found.")
    user.is_verified = True
    await db.flush()
    return user


async def start_password_reset(db: AsyncSession, email: str) -> tuple[User | None, str | None]:
    """Returns (user, token) or (None, None) — callers must not reveal existence."""
    user = await db.scalar(select(User).where(User.email == email.lower()))
    if not user:
        return None, None
    return user, create_reset_token(user.id)


async def reset_password(db: AsyncSession, token: str, new_password: str) -> User:
    try:
        payload = decode_token(token, expected_type=TokenType.PASSWORD_RESET)
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired reset link.") from exc
    user = await db.get(User, payload["sub"])
    if not user:
        raise NotFoundError("User not found.")
    user.hashed_password = hash_password(new_password)
    await db.flush()
    return user


async def change_password(db: AsyncSession, user: User, current: str, new: str) -> None:
    if not verify_password(current, user.hashed_password):
        raise AuthError("Current password is incorrect.")
    user.hashed_password = hash_password(new)
    await db.flush()


async def count_users(db: AsyncSession) -> int:
    return await db.scalar(select(func.count(User.id))) or 0
