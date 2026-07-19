"""Aggregate all v1 REST routers under a single APIRouter."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, conversations, meta, progress, users, voice

api_router = APIRouter()
api_router.include_router(meta.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(conversations.router)
api_router.include_router(voice.router)
api_router.include_router(progress.router)
api_router.include_router(admin.router)
