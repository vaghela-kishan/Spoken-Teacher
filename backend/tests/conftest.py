"""Pytest fixtures — spin up the app against an isolated SQLite database."""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "")  # force in-memory fallback
os.environ.setdefault("GEMINI_API_KEY", "")  # force heuristic tutor
os.environ.setdefault("SECRET_KEY", "test-secret-key-must-be-long-enough-1234")

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.database import Base, engine  # noqa: E402
from app.core.redis import init_redis  # noqa: E402
from app.main import app  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def _setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await init_redis()
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "u@test.com", "password": "Passw0rd!", "full_name": "Test User"},
    )
    res = await client.post(
        "/api/v1/auth/login", json={"email": "u@test.com", "password": "Passw0rd!"}
    )
    token = res.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
