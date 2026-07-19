"""Admin analytics service.

Queries are written to be portable across SQLite (dev/tests) and PostgreSQL
(prod). Time-bucketing for the last N days is done with a generated date axis so
empty days still appear in charts.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation, Message
from app.models.correction import GrammarCorrection
from app.models.stats import DailyStat
from app.models.user import User
from app.models.voice import VoiceRecording
from app.schemas.admin import AdminAnalytics, AdminOverview, LiveCounters, TimeseriesPoint
from app.services import presence


def _date_axis(days: int) -> list[str]:
    today = datetime.now(UTC).date()
    return [(today - timedelta(days=i)).isoformat() for i in range(days - 1, -1, -1)]


async def get_live_counters(db: AsyncSession, now: float) -> LiveCounters:
    total = await db.scalar(select(func.count(User.id))) or 0
    online = await presence.online_count(now)

    today = datetime.now(UTC).date().isoformat()
    active_today = (
        await db.scalar(
            select(func.count(func.distinct(DailyStat.user_id))).where(DailyStat.date == today)
        )
        or 0
    )
    week_ago = datetime.now(UTC) - timedelta(days=7)
    new_this_week = (
        await db.scalar(select(func.count(User.id)).where(User.created_at >= week_ago)) or 0
    )
    return LiveCounters(
        total_users=total,
        online_users=online,
        active_today=active_today,
        new_this_week=new_this_week,
    )


async def get_overview(db: AsyncSession, now: float) -> AdminOverview:
    counters = await get_live_counters(db, now)
    total_conversations = await db.scalar(select(func.count(Conversation.id))) or 0
    total_voice = (
        await db.scalar(select(func.count(Message.id)).where(Message.audio_url.isnot(None))) or 0
    )
    total_voice += await db.scalar(select(func.count(VoiceRecording.id))) or 0
    total_corrections = await db.scalar(select(func.count(GrammarCorrection.id))) or 0
    avg_session = await db.scalar(select(func.avg(Conversation.duration_seconds))) or 0.0

    return AdminOverview(
        total_users=counters.total_users,
        online_users=counters.online_users,
        active_today=counters.active_today,
        total_conversations=total_conversations,
        total_voice_messages=total_voice,
        total_corrections=total_corrections,
        avg_session_seconds=round(float(avg_session), 1),
    )


async def get_analytics(db: AsyncSession, days: int = 30) -> AdminAnalytics:
    axis = _date_axis(days)
    since = datetime.now(UTC) - timedelta(days=days)

    # ---- user growth (cumulative) ----
    users = (await db.execute(select(User.created_at))).scalars().all()
    per_day: dict[str, int] = defaultdict(int)
    for created in users:
        per_day[created.date().isoformat()] += 1
    cumulative = 0
    base = sum(1 for c in users if c.date().isoformat() < axis[0])
    growth: list[TimeseriesPoint] = []
    cumulative = base
    for d in axis:
        cumulative += per_day.get(d, 0)
        growth.append(TimeseriesPoint(label=d, value=cumulative))

    # ---- conversations per day ----
    convos = (
        (await db.execute(select(Conversation.created_at).where(Conversation.created_at >= since)))
        .scalars()
        .all()
    )
    convo_map: dict[str, int] = defaultdict(int)
    for c in convos:
        convo_map[c.date().isoformat()] += 1
    conversations = [TimeseriesPoint(label=d, value=convo_map.get(d, 0)) for d in axis]

    # ---- corrections + avg score per day (from DailyStat rollups) ----
    stats = (await db.execute(select(DailyStat).where(DailyStat.date.in_(axis)))).scalars().all()
    corr_map: dict[str, int] = defaultdict(int)
    score_sum: dict[str, float] = defaultdict(float)
    score_cnt: dict[str, int] = defaultdict(int)
    for s in stats:
        corr_map[s.date] += s.corrections
        if s.avg_overall:
            score_sum[s.date] += s.avg_overall
            score_cnt[s.date] += 1
    corrections = [TimeseriesPoint(label=d, value=corr_map.get(d, 0)) for d in axis]
    avg_scores = [
        TimeseriesPoint(
            label=d, value=round(score_sum[d] / score_cnt[d], 1) if score_cnt.get(d) else 0
        )
        for d in axis
    ]

    return AdminAnalytics(
        user_growth=growth,
        conversations_per_day=conversations,
        corrections_per_day=corrections,
        avg_score_per_day=avg_scores,
    )
