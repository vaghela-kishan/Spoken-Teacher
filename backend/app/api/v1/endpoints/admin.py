"""Admin panel endpoints (RBAC: admin only)."""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentAdmin, DbSession
from app.models.progress import LearningProgress
from app.models.user import User
from app.schemas.admin import AdminAnalytics, AdminOverview, AdminUserRow, LiveCounters
from app.schemas.common import Page
from app.services import admin_service


def _now() -> float:
    return datetime.now(UTC).timestamp()


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverview)
async def overview(_: CurrentAdmin, db: DbSession) -> AdminOverview:
    return await admin_service.get_overview(db, _now())


@router.get("/counters", response_model=LiveCounters)
async def counters(_: CurrentAdmin, db: DbSession) -> LiveCounters:
    return await admin_service.get_live_counters(db, _now())


@router.get("/analytics", response_model=AdminAnalytics)
async def analytics(
    _: CurrentAdmin, db: DbSession, days: int = Query(30, ge=7, le=365)
) -> AdminAnalytics:
    return await admin_service.get_analytics(db, days)


@router.get("/users", response_model=Page[AdminUserRow])
async def list_users(
    _: CurrentAdmin,
    db: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None),
) -> Page[AdminUserRow]:
    base = select(User).options(selectinload(User.profile), selectinload(User.progress))
    if q:
        like = f"%{q.lower()}%"
        base = base.where(func.lower(User.email).like(like) | func.lower(User.full_name).like(like))

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = (
        (
            await db.execute(
                base.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size)
            )
        )
        .scalars()
        .all()
    )

    items: list[AdminUserRow] = []
    for u in rows:
        row = AdminUserRow.model_validate(u)
        if u.progress:
            row.total_sessions = u.progress.total_sessions
            row.xp = u.progress.xp
            row.level = u.progress.level
        items.append(row)

    return Page[AdminUserRow](
        items=items, total=total, page=page, size=size, pages=(total + size - 1) // size
    )


@router.get("/reports/users.csv")
async def export_users_csv(_: CurrentAdmin, db: DbSession) -> StreamingResponse:
    rows = (
        await db.execute(
            select(User, LearningProgress)
            .outerjoin(LearningProgress, LearningProgress.user_id == User.id)
            .order_by(User.created_at.desc())
        )
    ).all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["id", "email", "full_name", "role", "verified", "created_at", "sessions", "xp", "level"]
    )
    for user, progress in rows:
        writer.writerow(
            [
                user.id,
                user.email,
                user.full_name or "",
                user.role.value,
                user.is_verified,
                user.created_at.isoformat(),
                progress.total_sessions if progress else 0,
                progress.xp if progress else 0,
                progress.level if progress else 1,
            ]
        )
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_report.csv"},
    )
