"""Groq LLM tutor — ultra-fast replies (Llama models on Groq's LPU).

Same interface as the Gemini tutor (`.generate()` / `.enabled`) so the two are
interchangeable. Groq's `response_format=json_object` guarantees valid JSON,
and its inference is typically sub-second — ideal for a real-time conversation.
Falls back to the offline heuristic on any error.
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

try:
    from groq import Groq

    _GROQ_AVAILABLE = True
except Exception:  # pragma: no cover
    Groq = None  # type: ignore
    _GROQ_AVAILABLE = False


class GroqTutor:
    def __init__(self) -> None:
        self._enabled = bool(settings.GROQ_API_KEY) and _GROQ_AVAILABLE
        self._client = None
        if self._enabled:
            self._client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info(f"Groq enabled (model={settings.GROQ_MODEL}).")

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
        if not self._enabled:
            return heuristic_feedback(user_text)
        try:
            raw = await self._call_model(user_text, history or [], proficiency, mode)
            return parse_tutor_reply(raw, user_text)
        except Exception as exc:  # pragma: no cover - network dependent
            logger.error(f"Groq generation failed, falling back: {exc}")
            return heuristic_feedback(user_text)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.3, max=3), reraise=True)
    async def _call_model(
        self, user_text: str, history: list[dict[str, str]], proficiency: str, mode: str
    ) -> str:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": build_system_prompt(proficiency, mode)}
        ]
        for turn in history[-8:]:
            role = "user" if turn.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": turn.get("content", "")})
        messages.append({"role": "user", "content": user_text})

        def _run() -> str:
            resp = self._client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
                response_format={"type": "json_object"},
            )
            return resp.choices[0].message.content or ""

        return await asyncio.to_thread(_run)


groq_tutor = GroqTutor()
