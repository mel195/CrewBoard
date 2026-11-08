"""Placements: the schedule of one job (visits + crews). Confirm/move services come in build step 3."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, Index, SmallInteger, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class Placement(TenantScoped, Versioned, Base):
    __tablename__ = "placement"
    __extra_args__ = (UniqueConstraint("job_id"), tfk(["job_id"], "ops.job", "CASCADE"),
                      CheckConstraint("status in ('draft','scheduled')", name="status"),
                      CheckConstraint("half_day is null or half_day in ('am','pm')", name="half"),
                      CheckConstraint("source in ('manual','plan_all','optimizer','riley','import')", name="source"),
                      tfk(["pm_id"], "config.project_manager", "SET NULL"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    status: Mapped[str] = mapped_column(Text, default="draft")
    half_day: Mapped[str | None] = mapped_column(Text)
    recommended_by: Mapped[str | None] = mapped_column(Text)
    recommended_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    override_reason: Mapped[str | None] = mapped_column(Text)
    pm_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    source: Mapped[str] = mapped_column(Text, default="manual")


class PlacementCrew(TenantScoped, Base):
    __tablename__ = "placement_crew"
    __extra_args__ = (UniqueConstraint("placement_id", "crew_id"), tfk(["placement_id"], "ops.placement", "CASCADE"),
                      tfk(["crew_id"], "ops.crew"), CheckConstraint("role in ('lead','extra')", name="role"),
                      Index("uq_placement_lead", "placement_id", unique=True, postgresql_where=text("role = 'lead'")),
                      Index("ix_placement_crew_crew", "tenant_id", "crew_id"))
    placement_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    role: Mapped[str] = mapped_column(Text, default="lead")


class PlacementVisit(TenantScoped, Base):
    __tablename__ = "placement_visit"
    __extra_args__ = (UniqueConstraint("placement_id", "seq"), tfk(["placement_id"], "ops.placement", "CASCADE"),
                      CheckConstraint("end_date >= start_date", name="range"), CheckConstraint("seq between 1 and 2", name="seq"),
                      Index("ix_placement_visit_range", "tenant_id", "start_date", "end_date"))
    placement_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    seq: Mapped[int] = mapped_column(SmallInteger)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)


class SchedulingDecision(TenantScoped, Base):
    """Append-only record of every scheduling decision with the full score snapshot (BL-39, AUD-02)."""
    __tablename__ = "scheduling_decision"
    __extra_args__ = (tfk(["job_id"], "ops.job", "CASCADE"),
                      CheckConstraint("kind in ('confirm','override','move','unschedule','clear','plan_all_confirm',"
                                      "'optimizer_apply','riley_book','riley_undo')", name="kind"),
                      CheckConstraint("actor_kind in ('person','riley','optimizer')", name="actor"),
                      Index("ix_decision_job", "tenant_id", "job_id", "created_at"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    placement_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))   # survives a cleared placement
    kind: Mapped[str] = mapped_column(Text)
    actor_kind: Mapped[str] = mapped_column(Text, default="person")
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    actor_label: Mapped[str] = mapped_column(Text)
    crew_ids: Mapped[list] = mapped_column(JSONB, default=list)
    visits: Mapped[list] = mapped_column(JSONB, default=list)
    before: Mapped[dict | None] = mapped_column(JSONB)
    reason_code: Mapped[str | None] = mapped_column(Text)
    reason_note: Mapped[str | None] = mapped_column(Text)
    top_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    top_score: Mapped[int | None] = mapped_column(SmallInteger)
    chosen_score: Mapped[int | None] = mapped_column(SmallInteger)
    conflicts: Mapped[list] = mapped_column(JSONB, default=list)
    score_snapshot: Mapped[list] = mapped_column(JSONB, default=list)
