"""Optimizer runs and moves (OPT-01 to OPT-10). Scheduler feedback is carried run to run in `constraints` (prototype S.ofb)."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, Float, Integer, SmallInteger, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class OptimizerRun(TenantScoped, Base):
    __tablename__ = "optimizer_run"
    __extra_args__ = (UniqueConstraint("tenant_id", "run_no"), CheckConstraint("status in ('proposed','applied','discarded','superseded')", name="status"),
                      CheckConstraint("lock_days between 3 and 7", name="lock"))
    run_no: Mapped[int] = mapped_column(Integer)
    parent_run_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    window_from: Mapped[date] = mapped_column(Date)
    window_to: Mapped[date] = mapped_column(Date)
    lock_days: Mapped[int] = mapped_column(SmallInteger)
    include_all_crews: Mapped[bool] = mapped_column(Boolean, default=False)
    weigh_margin: Mapped[bool] = mapped_column(Boolean, default=False)
    riley: Mapped[bool] = mapped_column(Boolean, default=False)
    open_days_before: Mapped[float] = mapped_column(Float)
    open_days_after: Mapped[float] = mapped_column(Float)
    skipped: Mapped[list] = mapped_column(JSONB, default=list)
    constraints: Mapped[dict] = mapped_column(JSONB, default=dict)   # {reject: {job: [crew]}, no_move: {placement: true}, block: [...]}
    fingerprint: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(Text, default="proposed")
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class OptimizerMove(TenantScoped, Base):
    __tablename__ = "optimizer_move"
    __extra_args__ = (UniqueConstraint("run_id", "seq"), tfk(["run_id"], "ops.optimizer_run", "CASCADE"),
                      CheckConstraint("selection in ('keep','reject')", name="sel"))
    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    seq: Mapped[int] = mapped_column(SmallInteger)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    half_day: Mapped[str | None] = mapped_column(Text)
    score: Mapped[int] = mapped_column(SmallInteger)
    value: Mapped[float] = mapped_column(Float)
    fit: Mapped[int] = mapped_column(SmallInteger)
    margin_pct: Mapped[int | None] = mapped_column(SmallInteger)
    not_ready_crew: Mapped[bool] = mapped_column(Boolean, default=False)
    kept_from_parent: Mapped[bool] = mapped_column(Boolean, default=False)
    top_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    top_score: Mapped[int | None] = mapped_column(SmallInteger)
    shift: Mapped[dict | None] = mapped_column(JSONB)          # {placement_id, days, name, from}
    alternatives: Mapped[list] = mapped_column(JSONB, default=list)
    fill: Mapped[float | None] = mapped_column(Float)
    selection: Mapped[str] = mapped_column(Text, default="keep")
    reject_key: Mapped[str | None] = mapped_column(Text)
    reject_label: Mapped[str | None] = mapped_column(Text)
