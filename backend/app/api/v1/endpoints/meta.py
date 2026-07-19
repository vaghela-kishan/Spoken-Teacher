"""Public meta endpoints: health check, public live counters, presence heartbeat."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.admin import LiveCounters
from app.schemas.common import Message
from app.services import admin_service, presence

router = APIRouter(tags=["meta"])


def _now() -> float:
    return datetime.now(UTC).timestamp()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/stats/live", response_model=LiveCounters)
async def live_counters(db: DbSession) -> LiveCounters:
    """Public live user counter for the landing page."""
    return await admin_service.get_live_counters(db, _now())


@router.post("/presence/heartbeat", response_model=Message)
async def heartbeat(user: CurrentUser) -> Message:
    """Called periodically by the client to mark the user as online."""
    await presence.heartbeat(user.id, _now())
    return Message(message="ok")
