"""Tenant settings (schema `config`). Defaults match the prototype (Phase 2, tab 3)."""
from __future__ import annotations

import uuid
from datetime import time

from sqlalchemy import Boolean, CheckConstraint, Index, Numeric, SmallInteger, Text, Time, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class SchedulingRules(TenantScoped, Versioned, Base):
    __tablename__ = "scheduling_rules"
    __schema__ = "config"
    __extra_args__ = (
        UniqueConstraint("tenant_id"),
        CheckConstraint("min_type_rating between 1 and 5", name="min_type"),
        CheckConstraint("important_bar between 1 and 5", name="imp_bar"),
        CheckConstraint("max_drive_min between 15 and 90", name="drive"),
        CheckConstraint("min_reviews between 1 and 10", name="reviews"),
        CheckConstraint("lock_days between 3 and 7", name="lock"),
        CheckConstraint("rain_threshold between 0 and 100", name="rain"),
    )
    weather_rule: Mapped[bool] = mapped_column(Boolean, default=True)
    lead_rule: Mapped[bool] = mapped_column(Boolean, default=True)
    important_rule: Mapped[bool] = mapped_column(Boolean, default=True)
    important_bar: Mapped[int] = mapped_column(SmallInteger, default=4)
    region_rule: Mapped[bool] = mapped_column(Boolean, default=True)
    max_drive_min: Mapped[int] = mapped_column(SmallInteger, default=45)
    min_type_rating: Mapped[int] = mapped_column(SmallInteger, default=3)
    min_reviews: Mapped[int] = mapped_column(SmallInteger, default=1)
    allow_unrated: Mapped[bool] = mapped_column(Boolean, default=False)
    review_before_send: Mapped[bool] = mapped_column(Boolean, default=True)
    lock_days: Mapped[int] = mapped_column(SmallInteger, default=5)
    important_value: Mapped[float] = mapped_column(Numeric(12, 2), default=12000)
    open_day_value: Mapped[float] = mapped_column(Numeric(12, 2), default=1000)       # PD-04
    riley_autobook_limit: Mapped[float] = mapped_column(Numeric(12, 2), default=2500) # PD-07
    rain_threshold: Mapped[int] = mapped_column(SmallInteger, default=50)            # PD-15
    slot_horizon_days: Mapped[int] = mapped_column(SmallInteger, default=28)
    span_horizon_days: Mapped[int] = mapped_column(SmallInteger, default=41)
    lead_safe_tracked: Mapped[bool] = mapped_column(Boolean, default=True)   # recommended field "leadSafe"
    languages_tracked: Mapped[bool] = mapped_column(Boolean, default=True)   # recommended field "languages"


class ImportantTrigger(TenantScoped, Base):
    __tablename__ = "important_trigger"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "key"),
                      CheckConstraint("key in ('returning','referrals','value','crm','trade','manual')", name="key"))
    key: Mapped[str] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class RatingDimension(TenantScoped, Base):
    __tablename__ = "rating_dimension"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "key"), CheckConstraint("kind in ('job_type','skill','attribute')", name="kind"))
    key: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(Text)
    trade: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)


class RankingLabel(TenantScoped, Versioned, Base):
    __tablename__ = "ranking_label"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "name"),)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)            # Balanced
    is_default_important: Mapped[bool] = mapped_column(Boolean, default=False)  # White glove
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)


class RankingLabelWeight(TenantScoped, Base):
    __tablename__ = "ranking_label_weight"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("label_id", "factor_key"), tfk(["label_id"], "config.ranking_label", "CASCADE"),
                      CheckConstraint("weight >= 0 and weight <= 5", name="weight"))
    label_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    factor_key: Mapped[str] = mapped_column(Text)
    weight: Mapped[float] = mapped_column(Numeric(3, 1))
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)


class JobLabel(TenantScoped, Base):
    __tablename__ = "job_label"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "name"),)
    name: Mapped[str] = mapped_column(Text)


class DefaultHours(TenantScoped, Base):
    __tablename__ = "default_hours"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "day_kind"), CheckConstraint("day_kind in ('weekday','saturday','sunday')", name="kind"),
                      CheckConstraint("(start_time is null) = (end_time is null) and (start_time is null or start_time < end_time)", name="range"))
    day_kind: Mapped[str] = mapped_column(Text)
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)


class ProjectManager(TenantScoped, Base):
    """Receives job handoffs (BRD-07). Replaces the prototype's PMS."""
    __tablename__ = "project_manager"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "name"), CheckConstraint("channel in ('text','email','whatsapp')", name="channel"))
    name: Mapped[str] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(Text, default="text")
    language: Mapped[str] = mapped_column(Text, default="en")
    membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class MessageTrigger(TenantScoped, Base):
    """Which recipients get a message for each trigger (BL-52, MSG-07)."""
    __tablename__ = "message_trigger"
    __schema__ = "config"
    __extra_args__ = (UniqueConstraint("tenant_id", "trigger", "recipient_role"),
                      CheckConstraint("trigger in ('confirm','move','cancel','reminder','rain','colors')", name="trigger"),
                      CheckConstraint("recipient_role in ('crew','client','hoa','pm')", name="role"))
    trigger: Mapped[str] = mapped_column(Text)
    recipient_role: Mapped[str] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
