"""WebSocket connection manager.

Tracks active sockets per user so we can support multiple tabs, broadcast, and
handle "interrupt" signals (cancel the in-flight AI task when the user starts
speaking again).
"""

from __future__ import annotations

import asyncio
from collections import defaultdict

from fastapi import WebSocket

from app.core.logging import logger


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._tasks: dict[WebSocket, asyncio.Task] = {}

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[user_id].add(ws)
        logger.debug(f"WS connected: user={user_id} (total={self.count})")

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        self._connections[user_id].discard(ws)
        if not self._connections[user_id]:
            self._connections.pop(user_id, None)
        self.cancel(ws)
        logger.debug(f"WS disconnected: user={user_id} (total={self.count})")

    def has_connections(self, user_id: str) -> bool:
        """True while the user still has at least one live socket (multi-tab safe)."""
        return bool(self._connections.get(user_id))

    def track(self, ws: WebSocket, task: asyncio.Task) -> None:
        # Cancel any still-running turn for this socket before replacing it, so an
        # overlapping turn can't be orphaned (uncancellable) or create duplicates.
        self.cancel(ws)
        self._tasks[ws] = task

    def cancel(self, ws: WebSocket) -> None:
        """Cancel any in-flight generation task for this socket (interrupt support)."""
        task = self._tasks.pop(ws, None)
        if task and not task.done():
            task.cancel()

    @property
    def count(self) -> int:
        return sum(len(s) for s in self._connections.values())


manager = ConnectionManager()
