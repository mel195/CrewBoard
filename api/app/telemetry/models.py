"""Usage and feedback (schema `insight`). Only collected with the person's consent (WS-06 to WS-08, NAV-04, NAV-07)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class UsageSession(TenantScoped, Base):
    """One browser session. The client picks the id so batches from the same tab land in one session."""
    __tablename__ = "usage_session"
    __schema__ = "insight"
    __extra_args__ = (Index("ix_usage_session_member", "tenant_id", "membership_id", "last_seen_at"),)
    membership_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    role: Mapped[str] = mapped_column(Text)            # the member's role when the session started
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    role_view: Mapped[dict] = mapped_column(JSONB, default=dict)   # seconds spent viewing as each role (owner preview)


class UsageEvent(TenantScoped, Base):
    __tablename__ = "usage_event"
    __schema__ = "insight"
    __extra_args__ = (tfk(["session_id"], "insight.usage_session", "CASCADE"),
                      CheckConstraint("kind in ('page_time','feature')", name="kind"),
                      CheckConstraint("seconds >= 0 and count >= 0", name="amounts"),
                      Index("ix_usage_event_session", "tenant_id", "session_id"))
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    kind: Mapped[str] = mapped_column(Text)
    page: Mapped[str | None] = mapped_column(Text)
    feature: Mapped[str | None] = mapped_column(Text)
    seconds: Mapped[int] = mapped_column(Integer, default=0)
    count: Mapped[int] = mapped_column(Integer, default=0)


class FeedbackItem(TenantScoped, Base):
    __tablename__ = "feedback_item"
    __schema__ = "insight"
    __extra_args__ = (CheckConstraint("status in ('open','done')", name="status"),
                      CheckConstraint("kind in ('idea','bug','confusing','love')", name="kind"),
                      CheckConstraint("length(text) between 1 and 2000", name="text"))
    membership_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    page: Mapped[str] = mapped_column(Text)
    anchor: Mapped[str | None] = mapped_column(Text)
    context: Mapped[dict] = mapped_column(JSONB, default=dict)   # job, client, crew, panel, section, viewing-as
    kind: Mapped[str] = mapped_column(Text, default="idea")
    text: Mapped[str] = mapped_column(Text)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(Text, default="open")
    done_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
