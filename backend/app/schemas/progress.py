"""Progress, achievement, stats and voice-history schemas."""

from __future__ import annotations

from datetime import datetime

from app.models.enums import AchievementTier
from app.schemas.common import ORMModel


class ProgressRead(ORMModel):
    total_sessions: int
    total_minutes: int
    total_words_spoken: int
    total_corrections: int
    current_streak_days: int
    longest_streak_days: int
    last_practice_date: str | None = None
    avg_confidence: float
    avg_pronunciation: float
    avg_fluency: float
    avg_grammar: float
    avg_overall: float
    xp: int
    level: int


class AchievementRead(ORMModel):
    code: str
    title: str
    description: str
    icon: str
    tier: AchievementTier
    xp_reward: int
    threshold: int


class UserAchievementRead(ORMModel):
    unlocked_at: datetime
    achievement: AchievementRead


class DailyStatRead(ORMModel):
    date: str
    sessions: int
    minutes: int
    words_spoken: int
    corrections: int
    xp_earned: int
    avg_overall: float


class VoiceRecordingRead(ORMModel):
    id: str
    conversation_id: str | None = None
    audio_url: str | None = None
    transcript: str
    duration_seconds: float
    word_count: int
    stt_confidence: float
    overall_score: float | None = None
    created_at: datetime
