from __future__ import annotations

import uuid
from datetime import date, datetime, time

from sqlalchemy import (Boolean, CheckConstraint, Date, DateTime, Index, Integer, Numeric, SmallInteger, Text, Time, UniqueConstraint,
                        text)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class Crew(TenantScoped, Versioned, Base):
    __tablename__ = "crew"
    __extra_args__ = (
        CheckConstraint("status in ('active','inactive')", name="status"),
        CheckConstraint("size_min is null or (size_min > 0 and size_max >= size_min)", name="size"),
        CheckConstraint("channel is null or channel in ('text','email','whatsapp')", name="channel"),
        tfk(["base_area_id"], "ops.service_area"), tfk(["region_id"], "ops.region"),
        Index("uq_crew_active_name", "tenant_id", text("lower(name)"), unique=True, postgresql_where=text("archived_at is null")),
    )
    name: Mapped[str] = mapped_column(Text)
    color: Mapped[str] = mapped_column(Text, default="#2F6BD8")
    status: Mapped[str] = mapped_column(Text, default="active")
    size_min: Mapped[int | None] = mapped_column(SmallInteger)
    size_max: Mapped[int | None] = mapped_column(SmallInteger)
    base_area_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    region_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    languages: Mapped[str] = mapped_column(Text, default="")
    lead_language: Mapped[str | None] = mapped_column(Text)
    channel: Mapped[str | None] = mapped_column(Text)
    lead_safe_certified: Mapped[bool | None] = mapped_column(Boolean)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str] = mapped_column(Text, default="")
    pay_note: Mapped[str | None] = mapped_column(Text)
    salesforce_name: Mapped[str | None] = mapped_column(Text)
    calendar_id: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CrewMember(TenantScoped, Base):
    __tablename__ = "crew_member"
    __extra_args__ = (tfk(["crew_id"], "ops.crew", "CASCADE"),
                      Index("uq_crew_member_lead", "crew_id", unique=True, postgresql_where=text("is_lead")))
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    name: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text, default="Painter")
    is_lead: Mapped[bool] = mapped_column(Boolean, default=False)
    languages: Mapped[str] = mapped_column(Text, default="")
    phone: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class CrewRating(TenantScoped, Base):
    __tablename__ = "crew_rating"
    __extra_args__ = (UniqueConstraint("crew_id", "dimension_id"), tfk(["crew_id"], "ops.crew", "CASCADE"),
                      tfk(["dimension_id"], "config.rating_dimension", "CASCADE"),
                      CheckConstraint("value is null or value between 1 and 5", name="value"),
                      CheckConstraint("source in ('admin','import','reviews')", name="source"),
                      CheckConstraint("review_count >= 0", name="reviews"))
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    dimension_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    value: Mapped[float | None] = mapped_column(Numeric(2, 1))  # half points allowed, e.g. 3.5
    source: Mapped[str] = mapped_column(Text, default="reviews")
    review_count: Mapped[int] = mapped_column(Integer, default=0)


class CrewHours(TenantScoped, Base):
    """No rows = the tenant's default hours. A row with null times = day off (BL-02)."""
    __tablename__ = "crew_hours"
    __extra_args__ = (UniqueConstraint("crew_id", "day_kind"), tfk(["crew_id"], "ops.crew", "CASCADE"),
                      CheckConstraint("day_kind in ('weekday','saturday','sunday')", name="kind"),
                      CheckConstraint("(start_time is null) = (end_time is null) and (start_time is null or start_time < end_time)", name="range"))
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    day_kind: Mapped[str] = mapped_column(Text)
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)


class CrewCostPeriod(TenantScoped, Base):
    """Job history behind the Record and Cost factors and crew pay (BL-26, BL-27, BL-43)."""
    __tablename__ = "crew_cost_period"
    __extra_args__ = (tfk(["crew_id"], "ops.crew", "CASCADE"),)
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    period_start: Mapped[date | None] = mapped_column(Date)
    period_end: Mapped[date | None] = mapped_column(Date)
    sold_hours: Mapped[float] = mapped_column(Numeric(10, 2))
    actual_hours: Mapped[float] = mapped_column(Numeric(10, 2))
    crew_pay: Mapped[float] = mapped_column(Numeric(12, 2))
    jobs_count: Mapped[int | None] = mapped_column(Integer)
    five_star_reviews: Mapped[int | None] = mapped_column(Integer)
