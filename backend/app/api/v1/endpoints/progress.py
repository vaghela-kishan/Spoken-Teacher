"""Learning progress, achievements and statistics endpoints."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.models.achievement import Achievement, UserAchievement
from app.models.progress import LearningProgress
from app.models.stats import DailyStat
from app.schemas.progress import (
    AchievementRead,
    DailyStatRead,
    ProgressRead,
    UserAchievementRead,
)

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=ProgressRead)
async def get_progress(user: CurrentUser, db: DbSession) -> ProgressRead:
    row = await db.scalar(select(LearningProgress).where(LearningProgress.user_id == user.id))
    if row is None:
        row = LearningProgress(user_id=user.id)
        db.add(row)
        await db.flush()
    return ProgressRead.model_validate(row)


@router.get("/achievements", response_model=list[UserAchievementRead])
async def my_achievements(user: CurrentUser, db: DbSession) -> list[UserAchievementRead]:
    rows = (
        (
            await db.execute(
                select(UserAchievement)
                .where(UserAchievement.user_id == user.id)
                .options(selectinload(UserAchievement.achievement))
                .order_by(UserAchievement.unlocked_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [UserAchievementRead.model_validate(r) for r in rows]


@router.get("/achievements/catalogue", response_model=list[AchievementRead])
async def achievement_catalogue(user: CurrentUser, db: DbSession) -> list[AchievementRead]:
    rows = (await db.execute(select(Achievement).order_by(Achievement.threshold))).scalars().all()
    return [AchievementRead.model_validate(r) for r in rows]


@router.get("/stats/daily", response_model=list[DailyStatRead])
async def daily_stats(
    user: CurrentUser, db: DbSession, days: int = Query(30, ge=1, le=365)
) -> list[DailyStatRead]:
    since = (datetime.now(UTC) - timedelta(days=days)).date().isoformat()
    rows = (
        (
            await db.execute(
                select(DailyStat)
                .where(DailyStat.user_id == user.id, DailyStat.date >= since)
                .order_by(DailyStat.date)
            )
        )
        .scalars()
        .all()
    )
    return [DailyStatRead.model_validate(r) for r in rows]
