"""Chat turn + feedback + progress tests (offline heuristic tutor)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_chat_turn_returns_correction(auth_client: AsyncClient) -> None:
    res = await auth_client.post(
        "/api/v1/conversations/turn",
        json={"text": "I goes market yesterday.", "mode": "free_talk"},
    )
    assert res.status_code == 200
    body = res.json()
    fb = body["feedback"]
    assert fb["has_errors"] is True
    assert "went" in fb["corrected"].lower()
    assert 0 <= fb["scores"]["overall"] <= 100
    assert body["assistant_message"]["content"]


async def test_progress_updates_after_turn(auth_client: AsyncClient) -> None:
    await auth_client.post(
        "/api/v1/conversations/turn", json={"text": "Hello, how are you today?"}
    )
    res = await auth_client.get("/api/v1/progress")
    assert res.status_code == 200
    prog = res.json()
    assert prog["total_sessions"] >= 1
    assert prog["xp"] > 0


async def test_conversation_history(auth_client: AsyncClient) -> None:
    turn = await auth_client.post("/api/v1/conversations/turn", json={"text": "Good morning."})
    convo_id = turn.json()["conversation_id"]

    detail = await auth_client.get(f"/api/v1/conversations/{convo_id}")
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) == 2  # user + assistant


async def test_live_counter_public(client: AsyncClient) -> None:
    res = await client.get("/api/v1/stats/live")
    assert res.status_code == 200
    assert "total_users" in res.json()
