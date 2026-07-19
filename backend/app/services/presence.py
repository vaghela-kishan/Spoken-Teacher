"""Online-presence tracking for the live user counter.

Uses a Redis sorted-set keyed by user-id scored with the last-seen epoch. A user
counts as "online" if seen within the last `ONLINE_WINDOW` seconds. Works
identically against the in-memory Redis fallback for local dev.
"""

from __future__ import annotations

from app.core.redis import get_redis

_KEY = "presence:online"
ONLINE_WINDOW = 60  # seconds


async def heartbeat(user_id: str, now: float) -> None:
    r = get_redis()
    await r.zadd(_KEY, {user_id: now})
    # prune anything older than the window to keep the set small
    await r.zremrangebyscore(_KEY, 0, now - ONLINE_WINDOW)


async def online_count(now: float) -> int:
    r = get_redis()
    return int(await r.zcount(_KEY, now - ONLINE_WINDOW, now))


async def mark_offline(user_id: str) -> None:
    r = get_redis()
    # Push far into the past so the prune/window drops it immediately.
    await r.zadd(_KEY, {user_id: 0})
