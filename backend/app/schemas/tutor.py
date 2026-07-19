"""Schemas describing the AI tutor's structured feedback.

This is the contract between the Gemini service and the rest of the app — the
LLM is prompted to return exactly this JSON shape, which we validate before
persisting so bad model output can never corrupt the database.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorHighlight(BaseModel):
    """A span of the original sentence flagged as incorrect."""

    wrong: str = Field(..., description="The incorrect word/phrase as the user said it")
    correction: str = Field(..., description="The corrected word/phrase")
    reason: str = Field(..., description="Short explanation of the mistake")


class VocabSuggestion(BaseModel):
    word: str
    meaning: str
    example: str


class Scores(BaseModel):
    confidence: float = Field(0, ge=0, le=100)
    pronunciation: float = Field(0, ge=0, le=100)
    fluency: float = Field(0, ge=0, le=100)
    grammar: float = Field(0, ge=0, le=100)
    overall: float = Field(0, ge=0, le=100)


class TutorFeedback(BaseModel):
    """Full teacher feedback for one user utterance."""

    has_errors: bool = False
    original: str = ""
    corrected: str = ""
    native: str = ""
    grammar_explanation: str = ""
    pronunciation_tips: str = ""
    highlights: list[ErrorHighlight] = Field(default_factory=list)
    vocabulary: list[VocabSuggestion] = Field(default_factory=list)
    scores: Scores = Field(default_factory=Scores)


class TutorReply(BaseModel):
    """What the tutor sends back for a turn: a spoken reply + feedback."""

    reply: str = Field(..., description="Conversational, encouraging teacher reply")
    feedback: TutorFeedback = Field(default_factory=TutorFeedback)
