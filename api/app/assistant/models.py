from __future__ import annotations

import uuid

from sqlalchemy import CheckConstraint, Integer, SmallInteger, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class AssistantState(TenantScoped, Base):
    __tablename__ = "assistant_state"
    __extra_args__ = (UniqueConstraint("tenant_id"), CheckConstraint("stage between 0 and 3", name="stage"))
    stage: Mapped[int] = mapped_column(SmallInteger, default=0)


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
