"""Shared enumerations used across models and schemas."""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    USER = "user"
    ADMIN = "admin"


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationMode(StrEnum):
    FREE_TALK = "free_talk"
    ROLEPLAY = "roleplay"
    INTERVIEW = "interview"
    PRONUNCIATION = "pronunciation"
    GRAMMAR_DRILL = "grammar_drill"


class ProficiencyLevel(StrEnum):
    BEGINNER = "beginner"
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    UPPER_INTERMEDIATE = "upper_intermediate"
    ADVANCED = "advanced"


class AchievementTier(StrEnum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class ThemePreference(StrEnum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"
