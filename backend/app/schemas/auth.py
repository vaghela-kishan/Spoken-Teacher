"""Auth request/response schemas with strong password validation."""

from __future__ import annotations

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=64)
    full_name: str = Field(..., min_length=2, max_length=120)

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError("Password must be 8-64 chars and include upper, lower and a digit.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=64)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError("Password must be 8-64 chars and include upper, lower and a digit.")
        return v


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
