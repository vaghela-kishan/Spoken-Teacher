"""Offline heuristic tutor.

Used when Gemini is not configured (local dev / CI / graceful degradation).
It applies a small set of common ESL grammar rules so the product demonstrates
real corrections and scoring without any external API. It is intentionally
simple — the real teaching quality comes from Gemini in production.
"""

from __future__ import annotations

import re

from app.schemas.tutor import ErrorHighlight, Scores, TutorFeedback, TutorReply

# (pattern, replacement, human reason) — ordered, applied case-insensitively
_RULES: list[tuple[str, str, str]] = [
    (r"\bi\s+goes\b", "I go", "First-person singular uses the base verb 'go', not 'goes'."),
    (r"\bhe\s+go\b", "he goes", "Third-person singular present tense adds '-es': 'goes'."),
    (r"\bshe\s+go\b", "she goes", "Third-person singular present tense adds '-es': 'goes'."),
    (r"\bi\s+am\s+go\b", "I am going", "Use the present continuous 'am going'."),
    (r"\bi\s+has\b", "I have", "First-person uses 'have', not 'has'."),
    (r"\bhe\s+have\b", "he has", "Third-person singular uses 'has'."),
    (r"\bdidn'?t\s+went\b", "didn't go", "After 'did/didn't' use the base verb 'go'."),
    (r"\bmore\s+better\b", "better", "'Better' is already comparative; drop 'more'."),
    (r"\bi\s+am\s+agree\b", "I agree", "'Agree' is a verb; say 'I agree', not 'I am agree'."),
]

# insert 'to the' between a past-tense motion verb and a bare place noun
_MOTION = re.compile(r"\b(went|go|going)\s+(market|school|office|park|store|gym)\b", re.I)


# past-time markers imply the past tense
_PAST_MARKERS = re.compile(r"\b(yesterday|last\s+\w+|ago|this\s+morning)\b", re.I)
_PRESENT_GO = re.compile(r"\bi\s+goes?\b", re.I)


def _apply_rules(text: str) -> tuple[str, list[ErrorHighlight]]:
    corrected = text
    highlights: list[ErrorHighlight] = []

    # Tense: "I go/goes ... yesterday" → "I went ..." (past-time context).
    if _PAST_MARKERS.search(corrected) and _PRESENT_GO.search(corrected):
        m = _PRESENT_GO.search(corrected)
        highlights.append(
            ErrorHighlight(
                wrong=m.group(0),
                correction="I went",
                reason="A past-time word like 'yesterday' needs the past tense 'went'.",
            )
        )
        corrected = _PRESENT_GO.sub("I went", corrected, count=1)

    for pattern, repl, reason in _RULES:
        m = re.search(pattern, corrected, flags=re.IGNORECASE)
        if m:
            highlights.append(ErrorHighlight(wrong=m.group(0), correction=repl, reason=reason))
            corrected = re.sub(pattern, repl, corrected, flags=re.IGNORECASE)

    m = _MOTION.search(corrected)
    if m and "to the" not in corrected.lower():
        fixed = f"{m.group(1)} to the {m.group(2)}"
        highlights.append(
            ErrorHighlight(
                wrong=m.group(0),
                correction=fixed,
                reason="Motion verbs need a preposition + article: 'to the market'.",
            )
        )
        corrected = _MOTION.sub(fixed, corrected, count=1)
    return corrected, highlights


def _capitalize(sentence: str) -> str:
    sentence = sentence.strip()
    if not sentence:
        return sentence
    sentence = sentence[0].upper() + sentence[1:]
    if sentence[-1] not in ".?!":
        sentence += "."
    return sentence


def _score(has_errors: bool, n_errors: int, word_count: int) -> Scores:
    base = 92.0 if not has_errors else max(55.0, 90.0 - n_errors * 9)
    length_bonus = min(8.0, word_count * 0.8)
    grammar = round(base, 1)
    fluency = round(min(100.0, base - 4 + length_bonus), 1)
    pronunciation = round(min(100.0, base + 2), 1)
    confidence = round(min(100.0, 60 + word_count * 3), 1)
    overall = round((grammar * 0.35 + fluency * 0.25 + pronunciation * 0.2 + confidence * 0.2), 1)
    return Scores(
        confidence=confidence,
        pronunciation=pronunciation,
        fluency=fluency,
        grammar=grammar,
        overall=overall,
    )


def heuristic_feedback(user_text: str) -> TutorReply:
    corrected, highlights = _apply_rules(user_text)
    has_errors = bool(highlights)
    corrected_sentence = _capitalize(corrected)
    word_count = len(user_text.split())

    if has_errors:
        reasons = highlights[0].reason
        reply = (
            f'Nice try! A more natural way to say that is: "{corrected_sentence}" '
            "Keep going — what happened next?"
        )
        explanation = " ".join(h.reason for h in highlights)
        pron_tips = "Slow down on the corrected words and stress them clearly."
    else:
        reasons = ""
        reply = "That's great English! 👏 Tell me more — I'm curious to hear."
        explanation = ""
        pron_tips = ""

    feedback = TutorFeedback(
        has_errors=has_errors,
        original=user_text,
        corrected=corrected_sentence,
        native=corrected_sentence,
        grammar_explanation=explanation or reasons,
        pronunciation_tips=pron_tips,
        highlights=highlights,
        vocabulary=[],
        scores=_score(has_errors, len(highlights), word_count),
    )
    return TutorReply(reply=reply, feedback=feedback)
