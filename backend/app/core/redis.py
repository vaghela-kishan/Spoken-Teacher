"""Optional Redis client used for presence (online users), rate limiting and
pub/sub for live counters. The app degrades gracefully to an in-memory fallback
when Redis is not configured or unreachable, so it is never a hard dependency.
"""

from __future__ import annotations

import time
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings
from app.core.logging import logger

_redis: Redis | None = None


class _MemoryFallback:
    """Minimal in-memory stand-in supporting the subset of ops we use."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float | None]] = {}
        self._sets: dict[str, dict[str, float]] = {}

    async def setex(self, key: str, ttl: int, value: Any) -> None:
        self._store[key] = (value, time.time() + ttl)

    async def get(self, key: str) -> Any:
        item = self._store.get(key)
        if not item:
            return None
        value, exp = item
        if exp and exp < time.time():
            self._store.pop(key, None)
            return None
        return value

    async def zadd(self, key: str, mapping: dict[str, float]) -> None:
        self._sets.setdefault(key, {}).update(mapping)

    async def zcount(self, key: str, minv: float, maxv: float) -> int:
        members = self._sets.get(key, {})
        return sum(1 for s in members.values() if minv <= s <= maxv)

    async def zremrangebyscore(self, key: str, minv: float, maxv: float) -> None:
        members = self._sets.get(key, {})
        for m, s in list(members.items()):
            if minv <= s <= maxv:
                members.pop(m, None)

    async def ping(self) -> bool:
        return True


async def init_redis() -> None:
    global _redis
    if not settings.redis_enabled:
        logger.info("Redis disabled — using in-memory fallback for presence/counters.")
        _redis = _MemoryFallback()  # type: ignore[assignment]
        return
    try:
        client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        await client.ping()
        _redis = client
        logger.info("Connected to Redis.")
    except Exception as exc:  # pragma: no cover - network dependent
        logger.warning(f"Redis unavailable ({exc}); falling back to in-memory store.")
        _redis = _MemoryFallback()  # type: ignore[assignment]


async def close_redis() -> None:
    if isinstance(_redis, Redis):
        await _redis.aclose()


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialised — call init_redis() on startup.")
    return _redis  # type: ignore[return-value]
