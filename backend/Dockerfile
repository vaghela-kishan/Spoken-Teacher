# syntax=docker/dockerfile:1
# ---- Multi-stage build for a slim production image ----
FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (ffmpeg for audio; build tools for wheels that need them)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Pre-fetch the default Piper neural voice so server-side TTS works in the image.
# Non-fatal: if the download is unreachable at build time the app automatically
# falls back to browser (client-side) TTS, so the build never breaks.
RUN mkdir -p models && \
    (curl -fsSL -o models/en_US-amy-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx && \
     curl -fsSL -o models/en_US-amy-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json) \
    || echo "WARN: Piper voice not downloaded; server will use browser TTS."

# Non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
