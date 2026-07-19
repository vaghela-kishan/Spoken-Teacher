"""Security primitives: password hashing and JWT creation/validation.

Kept framework-agnostic so it can be unit-tested in isolation. Access and
refresh tokens are distinguished by a `type` claim; email-verify and
password-reset tokens reuse the same signing key with dedicated scopes.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"
    EMAIL_VERIFY = "email_verify"
    PASSWORD_RESET = "password_reset"


# ---------------------------------------------------------------- passwords ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ------------------------------------------------------------------- tokens ---
def _create_token(subject: str, token_type: TokenType, expires: timedelta, **extra: Any) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type.value,
        "iat": now,
        "exp": now + expires,
        "jti": uuid.uuid4().hex,
        **extra,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str, role: str = "user") -> str:
    return _create_token(
        subject,
        TokenType.ACCESS,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        role=role,
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject, TokenType.REFRESH, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )


def create_email_token(subject: str) -> str:
    return _create_token(
        subject, TokenType.EMAIL_VERIFY, timedelta(hours=settings.EMAIL_TOKEN_EXPIRE_HOURS)
    )


def create_reset_token(subject: str) -> str:
    return _create_token(
        subject, TokenType.PASSWORD_RESET, timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)
    )


def decode_token(token: str, expected_type: TokenType | None = None) -> dict[str, Any]:
    """Decode & verify a JWT. Raises `jwt.PyJWTError` subclasses on failure."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if expected_type is not None and payload.get("type") != expected_type.value:
        raise jwt.InvalidTokenError(f"Expected {expected_type.value} token")
    return payload
