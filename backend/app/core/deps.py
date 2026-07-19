"""FastAPI dependencies: authenticated-user resolution and role guards."""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, WebSocket, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import AsyncSessionLocal, get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import TokenType, decode_token
from app.models.enums import UserRole
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=False
)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def _user_from_token(token: str, db: AsyncSession) -> User:
    try:
        payload = decode_token(token, expected_type=TokenType.ACCESS)
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Token has expired.", code="token_expired") from exc
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid authentication token.") from exc

    user = await db.scalar(
        select(User).where(User.id == payload["sub"]).options(selectinload(User.profile))
    )
    if user is None:
        raise AuthError("User no longer exists.")
    if not user.is_active:
        raise ForbiddenError("Account is disabled.")
    return user


async def get_current_user(
    db: DbSession, token: Annotated[str | None, Depends(oauth2_scheme)]
) -> User:
    if not token:
        raise AuthError("Not authenticated.")
    return await _user_from_token(token, db)


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_verified_user(user: CurrentUser) -> User:
    if not user.is_verified:
        raise ForbiddenError("Please verify your email to continue.", code="email_unverified")
    return user


async def get_current_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin privileges required.")
    return user


CurrentAdmin = Annotated[User, Depends(get_current_admin)]


async def get_ws_user(websocket: WebSocket) -> User:
    """Authenticate a WebSocket via `?token=` query param or Sec-WebSocket-Protocol."""
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
    async with AsyncSessionLocal() as db:
        try:
            return await _user_from_token(token, db)
        except AuthError as exc:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason=exc.message
            ) from exc
