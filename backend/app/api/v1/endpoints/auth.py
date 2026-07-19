"""Authentication endpoints.

Notes on security:
- Password-reset & resend-verification always return 200 with a generic message
  to avoid leaking whether an email is registered (user enumeration).
- Verification/reset emails are dispatched as background tasks so the request
  returns immediately.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.deps import CurrentUser, DbSession
from app.schemas.auth import (
    AccessTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import Message
from app.schemas.user import UserRead
from app.services import auth_service, email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DbSession, bg: BackgroundTasks) -> UserRead:
    user = await auth_service.register_user(db, payload)
    token = await auth_service.create_email_verification(user)
    bg.add_task(email.send_verification_email, user.email, token)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user = await auth_service.authenticate(db, payload.email, payload.password)
    access, refresh, expires = auth_service.issue_tokens(user)
    return TokenResponse(access_token=access, refresh_token=refresh, expires_in=expires)


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def login_oauth_form(
    db: DbSession, form: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> TokenResponse:
    """OAuth2 password-flow alias so Swagger's Authorize button works."""
    user = await auth_service.authenticate(db, form.username, form.password)
    access, refresh, expires = auth_service.issue_tokens(user)
    return TokenResponse(access_token=access, refresh_token=refresh, expires_in=expires)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(payload: RefreshRequest, db: DbSession) -> AccessTokenResponse:
    access, expires = await auth_service.refresh_access_token(db, payload.refresh_token)
    return AccessTokenResponse(access_token=access, expires_in=expires)


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/verify-email", response_model=Message)
async def verify_email(payload: VerifyEmailRequest, db: DbSession) -> Message:
    await auth_service.verify_email_token(db, payload.token)
    return Message(message="Email verified successfully.")


@router.post("/resend-verification", response_model=Message)
async def resend_verification(
    payload: ResendVerificationRequest, db: DbSession, bg: BackgroundTasks
) -> Message:
    user, _ = await auth_service.start_password_reset(db, payload.email)  # reuse lookup
    if user and not user.is_verified:
        token = await auth_service.create_email_verification(user)
        bg.add_task(email.send_verification_email, user.email, token)
    return Message(message="If that email is registered, a verification link has been sent.")


@router.post("/forgot-password", response_model=Message)
async def forgot_password(
    payload: ForgotPasswordRequest, db: DbSession, bg: BackgroundTasks
) -> Message:
    user, token = await auth_service.start_password_reset(db, payload.email)
    if user and token:
        bg.add_task(email.send_reset_email, user.email, token)
    return Message(message="If that email is registered, a reset link has been sent.")


@router.post("/reset-password", response_model=Message)
async def reset_password(payload: ResetPasswordRequest, db: DbSession) -> Message:
    await auth_service.reset_password(db, payload.token, payload.new_password)
    return Message(message="Password reset successfully. You can now log in.")
