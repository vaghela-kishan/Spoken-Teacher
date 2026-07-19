"""Idempotent seed script.

Creates the bootstrap admin, a demo learner, and the achievements catalogue.
Run with:  python -m app.scripts.seed
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.logging import configure_logging, logger
from app.core.security import hash_password
from app.models.achievement import Achievement
from app.models.enums import AchievementTier, UserRole
from app.models.profile import Profile
from app.models.progress import LearningProgress
from app.models.setting import UserSetting
from app.models.user import User

# code format: "<metric>:<threshold>" — metric read by progress_service._check_achievements
ACHIEVEMENTS = [
    (
        "sessions:1",
        "First Words",
        "Complete your first speaking turn.",
        "sparkles",
        AchievementTier.BRONZE,
        50,
        1,
    ),
    (
        "sessions:10",
        "Warming Up",
        "Complete 10 speaking turns.",
        "flame",
        AchievementTier.BRONZE,
        80,
        10,
    ),
    (
        "sessions:50",
        "Conversationalist",
        "Complete 50 speaking turns.",
        "message-circle",
        AchievementTier.SILVER,
        150,
        50,
    ),
    (
        "sessions:200",
        "Fluent Talker",
        "Complete 200 speaking turns.",
        "mic",
        AchievementTier.GOLD,
        400,
        200,
    ),
    (
        "streak:3",
        "Consistent",
        "Practise 3 days in a row.",
        "calendar",
        AchievementTier.BRONZE,
        60,
        3,
    ),
    (
        "streak:7",
        "One Week Strong",
        "Maintain a 7-day streak.",
        "calendar-check",
        AchievementTier.SILVER,
        120,
        7,
    ),
    (
        "streak:30",
        "Unstoppable",
        "Maintain a 30-day streak.",
        "trophy",
        AchievementTier.PLATINUM,
        600,
        30,
    ),
    ("words:500", "Chatterbox", "Speak 500 words total.", "type", AchievementTier.BRONZE, 90, 500),
    (
        "words:5000",
        "Wordsmith",
        "Speak 5,000 words total.",
        "book-open",
        AchievementTier.GOLD,
        350,
        5000,
    ),
    ("level:5", "Rising Star", "Reach level 5.", "star", AchievementTier.SILVER, 200, 5),
    ("level:10", "Language Pro", "Reach level 10.", "award", AchievementTier.PLATINUM, 500, 10),
    (
        "corrections:25",
        "Quick Learner",
        "Learn from 25 corrections.",
        "check-circle",
        AchievementTier.SILVER,
        130,
        25,
    ),
]


async def _seed_achievements(db) -> None:
    existing = set((await db.execute(select(Achievement.code))).scalars().all())
    created = 0
    for code, title, desc, icon, tier, xp, threshold in ACHIEVEMENTS:
        if code in existing:
            continue
        db.add(
            Achievement(
                code=code,
                title=title,
                description=desc,
                icon=icon,
                tier=tier,
                xp_reward=xp,
                threshold=threshold,
            )
        )
        created += 1
    logger.info(f"Achievements: {created} created, {len(existing)} already present.")


async def _seed_user(db, email: str, password: str, name: str, role: UserRole) -> None:
    existing = await db.scalar(select(User).where(User.email == email.lower()))
    if existing:
        logger.info(f"User {email} already exists — skipping.")
        return
    user = User(
        email=email.lower(),
        hashed_password=hash_password(password),
        full_name=name,
        role=role,
        is_verified=True,
    )
    user.profile = Profile()
    user.settings = UserSetting()
    user.progress = LearningProgress()
    db.add(user)
    logger.info(f"Created {role.value}: {email}")


async def main() -> None:
    configure_logging()
    if settings.DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await _seed_achievements(db)
        await _seed_user(
            db,
            settings.FIRST_ADMIN_EMAIL,
            settings.FIRST_ADMIN_PASSWORD,
            "Administrator",
            UserRole.ADMIN,
        )
        await _seed_user(db, "learner@ai-tutor.app", "Learner@123", "Demo Learner", UserRole.USER)
        await db.commit()
    logger.info("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
