from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Index, Integer, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class Client(TenantScoped, Versioned, Base):
    __tablename__ = "client"
    __extra_args__ = (tfk(["service_area_id"], "ops.service_area"),
                      CheckConstraint("channel in ('text','email','whatsapp')", name="channel"),
                      Index("ix_client_name", "tenant_id", text("lower(name)")))
    name: Mapped[str] = mapped_column(Text)
    first_name: Mapped[str] = mapped_column(Text, default="")
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(Text, default="text")
    language: Mapped[str] = mapped_column(Text, default="en")
    address: Mapped[str | None] = mapped_column(Text)
    service_area_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    notes: Mapped[str] = mapped_column(Text, default="")
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ClientSignal(TenantScoped, Base):
    """Important-client signals (BL-20)."""
    __tablename__ = "client_signal"
    __extra_args__ = (UniqueConstraint("client_id"), tfk(["client_id"], "ops.client", "CASCADE"))
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    returning_since: Mapped[str | None] = mapped_column(Text)    # e.g. "2019 interior"
    referral_count: Mapped[int] = mapped_column(Integer, default=0)
    crm_vip: Mapped[bool] = mapped_column(Boolean, default=False)
    trade_type: Mapped[str | None] = mapped_column(Text)         # designer, realtor, property manager
    source: Mapped[str] = mapped_column(Text, default="manual")


class FollowUp(TenantScoped, Base):
    __tablename__ = "follow_up"
    __extra_args__ = (tfk(["client_id"], "ops.client", "CASCADE"),)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    due_date: Mapped[date] = mapped_column(Date)
    note: Mapped[str] = mapped_column(Text, default="")
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    done_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
