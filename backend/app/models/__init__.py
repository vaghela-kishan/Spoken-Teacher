"""Model registry.

Importing every model here ensures they are all registered on `Base.metadata`
before Alembic autogeneration / `create_all` runs.
"""

from app.core.database import Base
from app.models.achievement import Achievement, UserAchievement
from app.models.conversation import Conversation, Message
from app.models.correction import GrammarCorrection
from app.models.enums import (
    AchievementTier,
    ConversationMode,
    MessageRole,
    ProficiencyLevel,
    ThemePreference,
    UserRole,
)
from app.models.profile import Profile
from app.models.progress import LearningProgress
from app.models.setting import UserSetting
from app.models.stats import DailyStat
from app.models.user import User
from app.models.voice import VoiceRecording

__all__ = [
    "Base",
    "User",
    "Profile",
    "UserSetting",
    "Conversation",
    "Message",
    "GrammarCorrection",
    "VoiceRecording",
    "LearningProgress",
    "Achievement",
    "UserAchievement",
    "DailyStat",
    "UserRole",
    "MessageRole",
    "ConversationMode",
    "ProficiencyLevel",
    "AchievementTier",
    "ThemePreference",
]
