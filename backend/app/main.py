"""FastAPI application entrypoint.

Wires configuration, logging, CORS, static media, REST + WebSocket routers,
global exception handling and startup/shutdown lifecycle (Redis, DB bootstrap).
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, logger
from app.core.redis import close_redis, init_redis
from app.ws.voice import router as ws_router

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} [{settings.ENVIRONMENT}]")
    await init_redis()
    # In dev/test with SQLite we auto-create tables; prod uses Alembic migrations.
    if settings.DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite schema ensured (dev mode).")

    # Warm up the LLM connection so the first real message isn't a cold start.
    async def _warmup() -> None:
        try:
            from app.services.ai.tutor import get_tutor

            tutor = get_tutor()
            if getattr(tutor, "enabled", False):
                await tutor.generate("Hi")
                logger.info("LLM connection warmed up.")
        except Exception:  # pragma: no cover - best effort
            pass

    asyncio.create_task(_warmup())
    yield
    await close_redis()
    await engine.dispose()
    logger.info("Shutdown complete.")


# Hide the interactive API docs (and the OpenAPI schema) in production so the
# full API surface isn't published to the internet.
_docs_enabled = not settings.is_production
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-ready AI English Speaking Tutor API.",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
    lifespan=lifespan,
)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Error handling ----
register_exception_handlers(app)

# ---- Static media (TTS audio, avatars) ----
media_dir = Path("media")
media_dir.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# ---- Routers ----
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)  # WebSocket at /ws/voice


@app.get("/", tags=["meta"])
async def root() -> dict[str, str]:
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "ok",
    }


@app.get("/health", tags=["meta"], include_in_schema=False)
async def health() -> dict[str, str]:
    """Root-level liveness probe (used by the Docker/NGINX healthchecks)."""
    return {"status": "ok"}
