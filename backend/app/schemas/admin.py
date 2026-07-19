"""Admin dashboard & analytics schemas."""

from __future__ import annotations

from pydantic import BaseModel

from app.schemas.user import UserRead


class LiveCounters(BaseModel):
    total_users: int
    online_users: int
    active_today: int
    new_this_week: int


class AdminOverview(BaseModel):
    total_users: int
    online_users: int
    active_today: int
    total_conversations: int
    total_voice_messages: int
    total_corrections: int
    avg_session_seconds: float


class TimeseriesPoint(BaseModel):
    label: str
    value: float


class AdminAnalytics(BaseModel):
    user_growth: list[TimeseriesPoint]
    conversations_per_day: list[TimeseriesPoint]
    corrections_per_day: list[TimeseriesPoint]
    avg_score_per_day: list[TimeseriesPoint]


class AdminUserRow(UserRead):
    total_sessions: int = 0
    xp: int = 0
    level: int = 1
