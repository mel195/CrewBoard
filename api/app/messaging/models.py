"""Message batches (one review screen) and outbound messages (schema comms). MSG-01 to MSG-04."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class MessageBatch(TenantScoped, Base):
    __tablename__ = "message_batch"
    __schema__ = "comms"
    __extra_args__ = (CheckConstraint("status in ('draft','sent','skipped')", name="status"),
                      tfk(["decision_id"], "ops.scheduling_decision", "SET NULL"))
    trigger: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    decision_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    status: Mapped[str] = mapped_column(Text, default="draft")
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class OutboundMessage(TenantScoped, Base):
    __tablename__ = "outbound_message"
    __schema__ = "comms"
    __extra_args__ = (tfk(["batch_id"], "comms.message_batch", "CASCADE"),
                      CheckConstraint("status in ('draft','queued','logged','sent','failed','skipped')", name="status"),
                      CheckConstraint("channel in ('text','email','whatsapp')", name="channel"),
                      Index("ix_outbound_message_time", "tenant_id", "created_at"))
    batch_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    trigger: Mapped[str] = mapped_column(Text)
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    job_title: Mapped[str | None] = mapped_column(Text)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    recipient_key: Mapped[str] = mapped_column(Text)
    recipient_role: Mapped[str] = mapped_column(Text)
    recipient_name: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(Text)
    languages: Mapped[list] = mapped_column(JSONB, default=list)
    variants: Mapped[dict] = mapped_column(JSONB, default=dict)   # generated text per language
    body: Mapped[str] = mapped_column(Text)
    edited: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(Text, default="draft")
    sent_by: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
