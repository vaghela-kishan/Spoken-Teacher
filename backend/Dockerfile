# syntax=docker/dockerfile:1
# ---- Slim production image for the FastAPI backend ----
FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Minimal system deps. curl is only needed for the container healthcheck.
# (ffmpeg/build-essential are NOT installed here — the optional local speech
#  engines that need them are excluded from the default image. See
#  requirements-optional.txt if you want server-side STT/TTS.)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Most PaaS (Railway/Render) inject $PORT at runtime; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT:-8000}/health" || exit 1

# Apply DB migrations, then serve on the platform-provided port.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
