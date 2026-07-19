"""Conversation orchestration — the core "process one turn" pipeline.

    user text ──▶ Gemini tutor ──▶ persist(user msg, assistant msg, correction)
                                  └▶ update progress/stats/achievements
                                  └▶ (optional) synthesize reply audio

Shared by both the REST chat endpoint and the voice WebSocket so behaviour is
identical across text and speech.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.conversation import Conversation, Message
from app.models.correction import GrammarCorrection
from app.models.enums import ConversationMode, MessageRole
from app.models.user import User
from app.schemas.tutor import TutorReply
from app.services import progress_service
from app.services.ai.tts import text_to_speech
from app.services.ai.tutor import get_tutor


async def get_or_create_conversation(
    db: AsyncSession,
    user: User,
    conversation_id: str | None,
    mode: ConversationMode = ConversationMode.FREE_TALK,
    title: str | None = None,
) -> Conversation:
    if conversation_id:
        convo = await db.scalar(
            select(Conversation).where(
                Conversation.id == conversation_id, Conversation.user_id == user.id
            )
        )
        if convo is None:
            raise NotFoundError("Conversation not found.")
        return convo
    convo = Conversation(user_id=user.id, mode=mode, title=title or "New conversation")
    db.add(convo)
    await db.flush()
    return convo


async def _load_history(
    db: AsyncSession, conversation_id: str, limit: int = 8
) -> list[dict[str, str]]:
    rows = (
        (
            await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return [{"role": m.role.value, "content": m.content} for m in reversed(rows)]


async def process_turn(
    db: AsyncSession,
    user: User,
    *,
    conversation: Conversation,
    text: str,
    audio_url: str | None = None,
    stt_confidence: float | None = None,
    seconds: float = 0.0,
    synth_audio: bool = True,
) -> tuple[Message, Message, TutorReply, str | None]:
    """Run one full turn; returns (user_msg, assistant_msg, reply, reply_audio_url)."""
    proficiency = (
        user.profile.proficiency.value if user.profile and user.profile.proficiency else "beginner"
    )

    history = await _load_history(db, conversation.id)
    reply: TutorReply = await get_tutor().generate(
        text, history=history, proficiency=proficiency, mode=conversation.mode.value
    )
    fb = reply.feedback

    # 1) persist the student's message
    user_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=text,
        audio_url=audio_url,
        transcript_confidence=stt_confidence,
    )
    db.add(user_msg)
    await db.flush()

    # 2) attach the grammar correction / scores
    correction = GrammarCorrection(
        original_text=fb.original or text,
        corrected_text=fb.corrected or text,
        native_text=fb.native or fb.corrected or text,
        grammar_explanation=fb.grammar_explanation,
        pronunciation_tips=fb.pronunciation_tips,
        highlights=[h.model_dump() for h in fb.highlights],
        vocabulary_suggestions=[v.model_dump() for v in fb.vocabulary],
        confidence_score=fb.scores.confidence,
        pronunciation_score=fb.scores.pronunciation,
        fluency_score=fb.scores.fluency,
        grammar_score=fb.scores.grammar,
        overall_score=fb.scores.overall,
    )
    # Assign via the relationship so it is populated in memory — this avoids a
    # lazy load during response serialization (async sessions can't lazy-load).
    user_msg.correction = correction
    db.add(correction)

    # 3) persist the assistant reply
    reply_audio = await text_to_speech.synthesize(reply.reply) if synth_audio else None
    assistant_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.ASSISTANT,
        content=reply.reply,
        audio_url=reply_audio,
    )
    assistant_msg.correction = None  # mark scalar relationship loaded (no correction)
    db.add(assistant_msg)

    # 4) update conversation rollups
    conversation.message_count += 2
    conversation.duration_seconds += int(seconds)
    conversation.avg_overall_score = (
        fb.scores.overall
        if conversation.avg_overall_score is None
        else round((conversation.avg_overall_score + fb.scores.overall) / 2, 2)
    )
    if conversation.title == "New conversation" and text.strip():
        conversation.title = text.strip()[:60]

    # 5) progress / stats / achievements
    await progress_service.record_turn(
        db,
        user.id,
        scores=fb.scores,
        word_count=len(text.split()),
        had_correction=fb.has_errors,
        seconds=seconds,
    )

    await db.flush()
    return user_msg, assistant_msg, reply, reply_audio


async def get_conversation_detail(
    db: AsyncSession, user: User, conversation_id: str
) -> Conversation:
    convo = await db.scalar(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .options(selectinload(Conversation.messages).selectinload(Message.correction))
    )
    if convo is None:
        raise NotFoundError("Conversation not found.")
    return convo
