"""Auth flow tests."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_and_login(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.com", "password": "Str0ngPwd", "full_name": "Alice"},
    )
    assert res.status_code == 201
    assert res.json()["email"] == "a@b.com"

    res = await client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "Str0ngPwd"}
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body and "refresh_token" in body


async def test_duplicate_email_conflicts(client: AsyncClient) -> None:
    payload = {"email": "dup@b.com", "password": "Str0ngPwd", "full_name": "Dup"}
    await client.post("/api/v1/auth/register", json=payload)
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409


async def test_weak_password_rejected(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "w@b.com", "password": "weak", "full_name": "Weak"},
    )
    assert res.status_code == 422


async def test_me_requires_auth(client: AsyncClient) -> None:
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


async def test_refresh_token(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "r@b.com", "password": "Str0ngPwd", "full_name": "Robert"},
    )
    login = await client.post(
        "/api/v1/auth/login", json={"email": "r@b.com", "password": "Str0ngPwd"}
    )
    refresh = login.json()["refresh_token"]
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res.status_code == 200
    assert "access_token" in res.json()
