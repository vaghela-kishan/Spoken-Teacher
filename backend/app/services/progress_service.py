"""Progress, streaks, XP/levelling, daily statistics and achievement unlocks.

Called after every scored turn. All updates run inside the caller's transaction
so a failure never leaves progress half-written.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement, UserAchievement
from app.models.progress import LearningProgress
from app.models.stats import DailyStat
from app.schemas.tutor import Scores

XP_PER_TURN = 12
XP_PER_LEVEL = 500


def _running_avg(old: float, count: int, new: float) -> float:
    if count <= 0:
        return round(new, 2)
    return round((old * count + new) / (count + 1), 2)


def level_for_xp(xp: int) -> int:
    return max(1, xp // XP_PER_LEVEL + 1)


async def _get_or_create_progress(db: AsyncSession, user_id: str) -> LearningProgress:
    progress = await db.scalar(select(LearningProgress).where(LearningProgress.user_id == user_id))
    if progress is None:
        progress = LearningProgress(user_id=user_id)
        db.add(progress)
        await db.flush()
    return progress


async def record_turn(
    db: AsyncSession,
    user_id: str,
    *,
    scores: Scores,
    word_count: int,
    had_correction: bool,
    seconds: float,
) -> LearningProgress:
    progress = await _get_or_create_progress(db, user_id)
    prev_turns = progress.total_sessions

    # rolling averages
    progress.avg_confidence = _running_avg(progress.avg_confidence, prev_turns, scores.confidence)
    progress.avg_pronunciation = _running_avg(
        progress.avg_pronunciation, prev_turns, scores.pronunciation
    )
    progress.avg_fluency = _running_avg(progress.avg_fluency, prev_turns, scores.fluency)
    progress.avg_grammar = _running_avg(progress.avg_grammar, prev_turns, scores.grammar)
    progress.avg_overall = _running_avg(progress.avg_overall, prev_turns, scores.overall)

    progress.total_sessions += 1
    progress.total_words_spoken += word_count
    progress.total_minutes += max(0, round(seconds / 60))
    if had_correction:
        progress.total_corrections += 1

    # ---- streak ----
    today = datetime.now(UTC).date()
    _update_streak(progress, today)

    # ---- XP / level ----
    progress.xp += XP_PER_TURN
    progress.level = level_for_xp(progress.xp)

    await _upsert_daily_stat(db, user_id, today, scores, word_count, had_correction, seconds)
    await _check_achievements(db, user_id, progress)
    await db.flush()
    return progress


def _update_streak(progress: LearningProgress, today: date) -> None:
    last = progress.last_practice_date
    if last == today.isoformat():
        return
    yesterday = (today - timedelta(days=1)).isoformat()
    if last == yesterday:
        progress.current_streak_days += 1
    else:
        progress.current_streak_days = 1
    progress.longest_streak_days = max(progress.longest_streak_days, progress.current_streak_days)
    progress.last_practice_date = today.isoformat()


async def _upsert_daily_stat(
    db: AsyncSession,
    user_id: str,
    today: date,
    scores: Scores,
    word_count: int,
    had_correction: bool,
    seconds: float,
) -> None:
    key = today.isoformat()
    stat = await db.scalar(
        select(DailyStat).where(DailyStat.user_id == user_id, DailyStat.date == key)
    )
    if stat is None:
        stat = DailyStat(user_id=user_id, date=key)
        db.add(stat)
        await db.flush()
    prev = stat.sessions
    stat.avg_overall = _running_avg(stat.avg_overall, prev, scores.overall)
    stat.sessions += 1
    stat.words_spoken += word_count
    stat.minutes += max(0, round(seconds / 60))
    stat.corrections += 1 if had_correction else 0
    stat.xp_earned += XP_PER_TURN


async def _check_achievements(
    db: AsyncSession, user_id: str, progress: LearningProgress
) -> list[Achievement]:
    """Unlock any catalogue achievements whose threshold the user just crossed."""
    unlocked_ids = set(
        (
            await db.execute(
                select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id)
            )
        )
        .scalars()
        .all()
    )
    catalogue = (await db.execute(select(Achievement))).scalars().all()

    metric_for = {
        "sessions": progress.total_sessions,
        "streak": progress.current_streak_days,
        "words": progress.total_words_spoken,
        "level": progress.level,
        "corrections": progress.total_corrections,
    }
    newly: list[Achievement] = []
    for ach in catalogue:
        if ach.id in unlocked_ids:
            continue
        metric_key = ach.code.split(":")[0]  # e.g. "sessions:10"
        value = metric_for.get(metric_key, 0)
        if value >= ach.threshold:
            db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
            progress.xp += ach.xp_reward
            progress.level = level_for_xp(progress.xp)
            newly.append(ach)
    if newly:
        await db.flush()
    return newly
