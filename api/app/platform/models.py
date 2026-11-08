from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, Timestamps, new_id, sa_fk


class Tenant(Timestamps, Base):
    __tablename__ = "tenant"
    __table_args__ = (CheckConstraint("status in ('trial','active','suspended')", name="status"), {"schema": "platform"})
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(Text)
    # Company name used in messages to crews and clients, e.g. "Precision Painting Plus".
    message_name: Mapped[str | None] = mapped_column(Text)
    time_zone: Mapped[str] = mapped_column(Text, default="America/New_York")
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    default_language: Mapped[str] = mapped_column(Text, default="en")
    trades: Mapped[list[str]] = mapped_column(ARRAY(Text), default=lambda: ["painting"])
    status: Mapped[str] = mapped_column(Text, default="trial")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    # Demo tenants pin "today" so the prototype's sample calendar keeps working (DD-07). Real tenants leave it null.
    calendar_anchor: Mapped[date | None] = mapped_column(Date)


class AppUser(Timestamps, Base):
    __tablename__ = "app_user"
    __table_args__ = ({"schema": "platform"},)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(Text, unique=True)  # stored lower-case
    display_name: Mapped[str] = mapped_column(Text)
    auth_subject: Mapped[str | None] = mapped_column(Text, unique=True)


class Membership(Timestamps, Base):
    __tablename__ = "membership"
    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id"), UniqueConstraint("tenant_id", "id"),
        CheckConstraint("role in ('owner','admin','scheduler')", name="role"),
        CheckConstraint("status in ('invited','active','removed')", name="status"),
        {"schema": "platform"},
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa_fk("platform.tenant.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), sa_fk("platform.app_user.id"))
    role: Mapped[str] = mapped_column(Text)
    display_name: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="active")
    telemetry_consent: Mapped[bool | None] = mapped_column(Boolean)
