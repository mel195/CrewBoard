from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped


class AuditEvent(TenantScoped, Base):
    """Append-only (UPDATE and DELETE revoked in the migration). AUD-04."""
    __tablename__ = "audit_event"
    __schema__ = "audit"
    __extra_args__ = (Index("ix_audit_event_time", "tenant_id", "occurred_at"), Index("ix_audit_event_type", "tenant_id", "type", "occurred_at"),
                      CheckConstraint("type in ('Decision','Override','Edit','Import','Crew data','Setting','Export','Riley','Optimizer','Message','Integration')", name="type"))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    actor_label: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    entity_type: Mapped[str | None] = mapped_column(Text)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    text: Mapped[str] = mapped_column(Text)
    detail: Mapped[dict | None] = mapped_column(JSONB)
