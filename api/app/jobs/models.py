from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, Index, Integer, Numeric, SmallInteger, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class Job(TenantScoped, Versioned, Base):
    __tablename__ = "job"
    __extra_args__ = (
        tfk(["client_id"], "ops.client"), tfk(["job_type_id"], "config.rating_dimension"),
        tfk(["service_area_id"], "ops.service_area"), tfk(["region_id"], "ops.region"),
        CheckConstraint("sold_hours > 0", name="hours"), CheckConstraint("finish_by >= earliest_start", name="dates"),
        CheckConstraint("status in ('open','completed','cancelled')", name="status"),
        Index("ix_job_queue", "tenant_id", "queue_position", postgresql_where=text("status = 'open' and queue_position is not null")),
    )
    title: Mapped[str] = mapped_column(Text)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    trade: Mapped[str] = mapped_column(Text, default="painting")
    job_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    service_area_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    region_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    sold_hours: Mapped[float] = mapped_column(Numeric(8, 2))
    price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    earliest_start: Mapped[date] = mapped_column(Date)
    finish_by: Mapped[date] = mapped_column(Date)
    language: Mapped[str] = mapped_column(Text, default="en")
    important_note: Mapped[str | None] = mapped_column(Text)       # estimator flag (manual trigger)
    # Position in Ready to schedule. Null = not in the queue (for example a job confirmed before Crew Board).
    queue_position: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Text, default="open")
    write_up: Mapped[str | None] = mapped_column(Text)
    source_note: Mapped[str | None] = mapped_column(Text)          # e.g. "PaintScout #4127 · sold Oct 16 by Dana R."
    photos_count: Mapped[int | None] = mapped_column(Integer)
    sold_at: Mapped[date | None] = mapped_column(Date)


class JobSkill(TenantScoped, Base):
    __tablename__ = "job_skill"
    __extra_args__ = (UniqueConstraint("job_id", "dimension_id"), tfk(["job_id"], "ops.job", "CASCADE"),
                      tfk(["dimension_id"], "config.rating_dimension", "CASCADE"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    dimension_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)


class JobLabelLink(TenantScoped, Base):
    __tablename__ = "job_label_link"
    __extra_args__ = (UniqueConstraint("job_id", "job_label_id"), tfk(["job_id"], "ops.job", "CASCADE"),
                      tfk(["job_label_id"], "config.job_label", "CASCADE"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    job_label_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))


class JobFieldSource(TenantScoped, Base):
    """Where each field came from (ADD-07)."""
    __tablename__ = "job_field_source"
    __extra_args__ = (UniqueConstraint("job_id", "field"), tfk(["job_id"], "ops.job", "CASCADE"),
                      CheckConstraint("source in ('paintscout','typed','ai','rules','client_history','edited','missing')", name="source"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    field: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(Text)
    evidence_quote: Mapped[str | None] = mapped_column(Text)


class JobRevision(TenantScoped, Base):
    """Every edit to a job, with old and new values (ADD-15)."""
    __tablename__ = "job_revision"
    __extra_args__ = (tfk(["job_id"], "ops.job", "CASCADE"),)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    version: Mapped[int] = mapped_column(Integer)
    changes: Mapped[dict] = mapped_column(JSONB)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class JobRanking(TenantScoped, Base):
    """A job's chosen ranking label and custom weights (MAT-04, MAT-05; DD-25)."""
    __tablename__ = "job_ranking"
    __extra_args__ = (UniqueConstraint("job_id"), tfk(["job_id"], "ops.job", "CASCADE"), tfk(["label_id"], "config.ranking_label", "SET NULL"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    label_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    custom_weights: Mapped[dict | None] = mapped_column(JSONB)
