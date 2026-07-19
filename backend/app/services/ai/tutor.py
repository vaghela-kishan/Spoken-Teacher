"""LLM provider selector.

Returns the active tutor based on `LLM_PROVIDER`:
- "groq"   → Groq (fastest) if a key is configured
- "gemini" → Google Gemini if a key is configured
- "auto"   → prefer Groq, then Gemini, else the offline heuristic tutor

The chosen object always exposes `.generate(...)` and never raises — it degrades
to the built-in offline tutor when no provider is available.
"""
from __future__ import annotations

from app.core.config import settings
from app.services.ai.gemini import gemini_tutor
from app.services.ai.groq import groq_tutor


def get_tutor():
    provider = settings.LLM_PROVIDER.lower()

    if provider == "groq":
        return groq_tutor if groq_tutor.enabled else gemini_tutor
    if provider == "gemini":
        return gemini_tutor if gemini_tutor.enabled else groq_tutor

    # auto: prefer the fastest available
    if groq_tutor.enabled:
        return groq_tutor
    if gemini_tutor.enabled:
        return gemini_tutor
    return gemini_tutor  # offline heuristic fallback lives inside .generate()


def active_provider_name() -> str:
    t = get_tutor()
    if t is groq_tutor and groq_tutor.enabled:
        return f"groq:{settings.GROQ_MODEL}"
    if t is gemini_tutor and gemini_tutor.enabled:
        return f"gemini:{settings.GEMINI_MODEL}"
    return "offline-heuristic"
