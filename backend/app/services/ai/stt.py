"""Speech-to-text service.

Primary engine: faster-whisper (local, private, fast). When the model isn't
installed, the service reports `available = False` and the frontend falls back
to the browser's Web Speech API, sending us the transcript directly. Either way
the rest of the pipeline receives `(transcript, confidence)`.
"""

from __future__ import annotations

import asyncio
import math

from app.core.config import settings
from app.core.logging import logger

try:
    from faster_whisper import WhisperModel

    _WHISPER_AVAILABLE = True
except Exception:  # pragma: no cover
    WhisperModel = None  # type: ignore
    _WHISPER_AVAILABLE = False


class STTResult:
    __slots__ = ("text", "confidence", "duration")

    def __init__(self, text: str, confidence: float, duration: float) -> None:
        self.text = text
        self.confidence = confidence
        self.duration = duration


class SpeechToText:
    def __init__(self) -> None:
        self._model = None
        self._available = _WHISPER_AVAILABLE
        if self._available:
            try:
                self._model = WhisperModel(
                    settings.WHISPER_MODEL, device="cpu", compute_type="int8"
                )
                logger.info(f"Whisper STT ready (model={settings.WHISPER_MODEL}).")
            except Exception as exc:  # pragma: no cover
                logger.warning(f"Whisper init failed ({exc}); STT will use browser fallback.")
                self._available = False

    @property
    def available(self) -> bool:
        return self._available

    async def transcribe(self, audio_path: str) -> STTResult:
        """Transcribe an audio file. Runs the blocking model in a thread."""
        if not self._available or self._model is None:
            raise RuntimeError("Server-side STT unavailable; use browser transcription.")
        return await asyncio.to_thread(self._transcribe_sync, audio_path)

    def _transcribe_sync(self, audio_path: str) -> STTResult:
        segments, info = self._model.transcribe(audio_path, beam_size=5, language="en")
        parts: list[str] = []
        logprobs: list[float] = []
        for seg in segments:
            parts.append(seg.text)
            logprobs.append(getattr(seg, "avg_logprob", -0.5))
        text = " ".join(p.strip() for p in parts).strip()
        # Convert average log-prob to a rough 0-1 confidence.
        avg_lp = sum(logprobs) / len(logprobs) if logprobs else -1.0
        confidence = max(0.0, min(1.0, math.exp(avg_lp)))
        return STTResult(text=text, confidence=round(confidence, 3), duration=info.duration)


speech_to_text = SpeechToText()
