"""Connections to outside systems, links to their records, and the outbox (SET-08, CLI-04, ADD-12)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped

PROVIDERS = ("paintscout", "salesforce", "companycam", "google_calendar", "google_reviews", "sms", "email", "whatsapp")


class IntegrationConnection(TenantScoped, Base):
    """One per connector per tenant. `secret_ref` points into a secrets store; the secret itself is never stored here."""
    __tablename__ = "integration_connection"
    __schema__ = "platform"
    __extra_args__ = (UniqueConstraint("tenant_id", "provider"),
                      CheckConstraint("provider in ('paintscout','salesforce','companycam','google_calendar','google_reviews',"
                                      "'sms','email','whatsapp')", name="provider"),
                      CheckConstraint("status in ('not_connected','stub','connected','error')", name="status"))
    provider: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="not_connected")
    secret_ref: Mapped[str | None] = mapped_column(Text)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ExternalRef(TenantScoped, Base):
    __tablename__ = "external_ref"
    __extra_args__ = (UniqueConstraint("tenant_id", "provider", "external_id"), UniqueConstraint("tenant_id", "provider", "entity_type", "entity_id"),
                      CheckConstraint("match_method in ('name','created','manual')", name="match"))
    entity_type: Mapped[str] = mapped_column(Text)     # client, crew, job
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    provider: Mapped[str] = mapped_column(Text)
    external_id: Mapped[str] = mapped_column(Text)
    match_method: Mapped[str] = mapped_column(Text, default="manual")


class OutboxJob(TenantScoped, Base):
    """Work done after commit by the worker: outgoing calls and stored incoming webhooks. Claimed with FOR UPDATE SKIP LOCKED."""
    __tablename__ = "outbox_job"
    __schema__ = "system"
    __extra_args__ = (CheckConstraint("status in ('pending','running','done','failed')", name="status"),
                      Index("ix_outbox_pending", "status", "run_after"))
    kind: Mapped[str] = mapped_column(Text)            # e.g. webhook.paintscout, message.send
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    run_after: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(Text, default="pending")
    last_error: Mapped[str | None] = mapped_column(Text)
