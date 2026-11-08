from __future__ import annotations

import uuid

from sqlalchemy import CheckConstraint, DateTime, Integer, SmallInteger, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class AssistantState(TenantScoped, Base):
    __tablename__ = "assistant_state"
    __extra_args__ = (UniqueConstraint("tenant_id"), CheckConstraint("stage between 0 and 3", name="stage"))
    stage: Mapped[int] = mapped_column(SmallInteger, default=0)
    # Decisions Riley saw before Crew Board (for imported history; zero otherwise); live counts are added from observations.
    base_observed: Mapped[int] = mapped_column(Integer, default=0)
    base_agreed: Mapped[int] = mapped_column(Integer, default=0)
    base_by_type: Mapped[dict] = mapped_column(JSONB, default=dict)
    last_refreshed_at = mapped_column(DateTime(timezone=True))


class AssistantHabit(TenantScoped, Base):
    """Riley habit with a structured condition (DD-09). See app.assistant.engine.habit_matches."""
    __tablename__ = "assistant_habit"
    __extra_args__ = (tfk(["prefer_crew_id"], "ops.crew", "SET NULL"), tfk(["avoid_crew_id"], "ops.crew", "SET NULL"),
                      CheckConstraint("status in ('new','kept','ignored')", name="status"),
                      CheckConstraint("source in ('observation','answer','admin','import')", name="source"))
    text: Mapped[str] = mapped_column()
    condition: Mapped[dict | None] = mapped_column(JSONB)
    prefer_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    avoid_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    status: Mapped[str] = mapped_column(default="new")
    source: Mapped[str] = mapped_column(default="observation")
    evidence_count: Mapped[int] = mapped_column(Integer, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class AssistantObservation(TenantScoped, Base):
    """One per confirm by a person: what Riley would have picked and whether the scheduler agreed (BL-49, RIL-02)."""
    __tablename__ = "assistant_observation"
    __extra_args__ = (tfk(["decision_id"], "ops.scheduling_decision", "CASCADE"),)
    decision_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    job_type: Mapped[str] = mapped_column()
    scheduler_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    scheduler_label: Mapped[str] = mapped_column()
    riley_pick_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    chosen_crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    agreed: Mapped[bool] = mapped_column()
    reason: Mapped[str | None] = mapped_column()
    used_in_training: Mapped[bool] = mapped_column(default=True)


class AssistantQuestion(TenantScoped, Base):
    """Questions Riley asks admins or schedulers (RIL-06)."""
    __tablename__ = "assistant_question"
    __extra_args__ = (CheckConstraint("audience in ('admin','scheduler')", name="audience"),)
    audience: Mapped[str] = mapped_column(default="admin")
    kind: Mapped[str | None] = mapped_column()
    text: Mapped[str] = mapped_column()
    options: Mapped[list] = mapped_column(JSONB, default=list)
    answer: Mapped[str | None] = mapped_column()
    answered_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class AssistantLearner(TenantScoped, Base):
    """Whether Riley learns from a scheduler's decisions (RIL-07). No row = learns."""
    __tablename__ = "assistant_learner"
    __extra_args__ = (UniqueConstraint("tenant_id", "membership_id"),)
    membership_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    enabled: Mapped[bool] = mapped_column(default=True)
