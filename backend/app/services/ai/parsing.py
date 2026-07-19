"""Shared parsing of an LLM's JSON reply into a validated `TutorReply`.

Used by every LLM provider (Gemini, Groq, …). Robust to models that wrap the
JSON in prose/markdown; on any failure it degrades to the offline heuristic so
the conversation never breaks.
"""
from __future__ import annotations

import json
import re

from app.core.logging import logger
from app.schemas.tutor import TutorReply
from app.services.ai.fallback import heuristic_feedback

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


def parse_tutor_reply(raw: str, user_text: str) -> TutorReply:
    match = _JSON_RE.search(raw or "")
    if not match:
        logger.warning("No JSON found in LLM response; using fallback.")
        return heuristic_feedback(user_text)
    try:
        data = json.loads(match.group(0))
        reply = TutorReply.model_validate(data)
        reply.feedback.original = reply.feedback.original or user_text
        return reply
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning(f"Failed to validate LLM JSON ({exc}); using fallback.")
        return heuristic_feedback(user_text)
