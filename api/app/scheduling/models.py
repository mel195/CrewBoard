"""Placements: the schedule of one job (visits + crews). Confirm/move services come in build step 3."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, Index, SmallInteger, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class Placement(TenantScoped, Versioned, Base):
    __tablename__ = "placement"
    __extra_args__ = (UniqueConstraint("job_id"), tfk(["job_id"], "ops.job", "CASCADE"),
                      CheckConstraint("status in ('draft','scheduled')", name="status"),
                      CheckConstraint("half_day is null or half_day in ('am','pm')", name="half"),
                      CheckConstraint("source in ('manual','plan_all','optimizer','riley','import')", name="source"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    status: Mapped[str] = mapped_column(Text, default="draft")
    half_day: Mapped[str | None] = mapped_column(Text)
    recommended_by: Mapped[str | None] = mapped_column(Text)
    recommended_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    override_reason: Mapped[str | None] = mapped_column(Text)
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
