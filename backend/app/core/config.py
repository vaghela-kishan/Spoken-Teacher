"""Application configuration.

All settings are read from environment variables (12-factor) with sensible
development defaults. Validation happens once at import time via a cached
singleton so the rest of the app can `from app.core.config import settings`.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_DEFAULT_SECRET = "change-me-super-secret-key-min-32-chars-long"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    # ---- App ----
    PROJECT_NAME: str = "AI English Speaking Tutor"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "change-me-super-secret-key-min-32-chars-long"

    # ---- Auth ----
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    EMAIL_TOKEN_EXPIRE_HOURS: int = 48
    RESET_TOKEN_EXPIRE_HOURS: int = 2

    # ---- Database ----
    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"

    # ---- Redis ----
    REDIS_URL: str | None = "redis://localhost:6379/0"

    # ---- CORS ----
    # NoDecode: keep pydantic-settings from JSON-parsing the raw env value so the
    # `mode="before"` validator below can split a comma-separated string instead.
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )
    FRONTEND_URL: str = "http://localhost:5173"

    # ---- AI ----
    # Which LLM writes the tutor replies: "groq" (fast) | "gemini" | "auto"
    LLM_PROVIDER: str = "auto"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    WHISPER_MODEL: str = "base"
    TTS_ENGINE: str = "browser"  # piper | kokoro | browser
    PIPER_VOICE: str = "en_US-amy-medium"

    # ---- Email ----
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "AI English Tutor <no-reply@ai-tutor.app>"

    # ---- Bootstrap admin ----
    FIRST_ADMIN_EMAIL: str = "admin@ai-tutor.app"
    FIRST_ADMIN_PASSWORD: str = "Admin@12345"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def _guard_production(self) -> Settings:
        """Fail fast in production if unsafe defaults are still in place."""
        if self.is_production:
            problems: list[str] = []
            if self.SECRET_KEY == _DEFAULT_SECRET or len(self.SECRET_KEY) < 32:
                problems.append("SECRET_KEY must be set to a unique value of >=32 chars")
            if self.DATABASE_URL.startswith("sqlite"):
                problems.append("DATABASE_URL must not use SQLite in production")
            if not self.BACKEND_CORS_ORIGINS:
                problems.append("BACKEND_CORS_ORIGINS must be set explicitly")
            if problems:
                raise ValueError(
                    "Unsafe production configuration: " + "; ".join(problems)
                )
        return self

    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_USER)

    @property
    def redis_enabled(self) -> bool:
        return bool(self.REDIS_URL)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
