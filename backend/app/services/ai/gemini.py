"""Gemini LLM client that produces structured tutor feedback.

Design goals:
- Robust JSON extraction (models sometimes wrap JSON in prose/markdown).
- Automatic retry with backoff on transient errors.
- Graceful **offline fallback**: when no API key is configured (dev/CI), a
  deterministic heuristic tutor is used so the whole app still runs end-to-end.
"""

from __future__ import annotations

import asyncio

from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import logger
from app.schemas.tutor import TutorReply
from app.services.ai.fallback import heuristic_feedback
from app.services.ai.parsing import parse_tutor_reply
from app.services.ai.prompts import build_system_prompt

try:  # google-generativeai is optional at import time
    import google.generativeai as genai

    _GENAI_AVAILABLE = True
except Exception:  # pragma: no cover
    genai = None  # type: ignore
    _GENAI_AVAILABLE = False


class GeminiTutor:
    """Thin wrapper around the Gemini API tuned for the tutoring use-case."""

    def __init__(self) -> None:
        self._enabled = bool(settings.GEMINI_API_KEY) and _GENAI_AVAILABLE
        if self._enabled:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            logger.info(f"Gemini enabled (model={settings.GEMINI_MODEL}).")
        else:
            logger.warning("GEMINI_API_KEY not set — using offline heuristic tutor.")

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def generate(
        self,
        user_text: str,
        *,
        history: list[dict[str, str]] | None = None,
        proficiency: str = "beginner",
        mode: str = "free_talk",
    ) -> TutorReply:
        """Return a validated TutorReply for one student utterance."""
        if not self._enabled:
            return heuristic_feedback(user_text)
        try:
            raw = await self._call_model(user_text, history or [], proficiency, mode)
            return parse_tutor_reply(raw, user_text)
        except Exception as exc:  # pragma: no cover - network dependent
            logger.error(f"Gemini generation failed, falling back: {exc}")
            return heuristic_feedback(user_text)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.4, max=4), reraise=True)
    async def _call_model(
        self, user_text: str, history: list[dict[str, str]], proficiency: str, mode: str
    ) -> str:
        system = build_system_prompt(proficiency, mode)
        model = genai.GenerativeModel(
            settings.GEMINI_MODEL,
            system_instruction=system,
            generation_config={
                "temperature": 0.7,
                "response_mime_type": "application/json",
                # Enough headroom so the full feedback JSON is never truncated
                # (truncation produces invalid JSON and forces a fallback).
                "max_output_tokens": 2048,
            },
        )
        contents = []
        for turn in history[-8:]:  # keep context bounded for latency
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [turn.get("content", "")]})
        contents.append({"role": "user", "parts": [user_text]})

        # genai SDK is sync; run in a thread to stay non-blocking.
        response = await asyncio.to_thread(model.generate_content, contents)
        return response.text or ""


# module-level singleton
gemini_tutor = GeminiTutor()
