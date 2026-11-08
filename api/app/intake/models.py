"""Estimate documents and intake drafts (ADD-01 to ADD-14). Drafts are saved, unlike the prototype (DD-06)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, Versioned, tfk


class EstimateDocument(TenantScoped, Base):
    __tablename__ = "estimate_document"
    __extra_args__ = (CheckConstraint("status in ('uploaded','read','failed')", name="status"),
                      CheckConstraint("kind in ('file','paste','paintscout')", name="kind"))
    kind: Mapped[str] = mapped_column(Text)
    filename: Mapped[str] = mapped_column(Text)
    mime_type: Mapped[str | None] = mapped_column(Text)
    file_ref: Mapped[str | None] = mapped_column(Text)        # key in the file store; text-only documents have none
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    page_count: Mapped[int | None] = mapped_column(Integer)
    extracted_text: Mapped[str | None] = mapped_column(Text)
    reader: Mapped[str | None] = mapped_column(Text)          # ai | rules
    status: Mapped[str] = mapped_column(Text, default="uploaded")
    error: Mapped[str | None] = mapped_column(Text)
    paintscout: Mapped[dict | None] = mapped_column(JSONB)    # fields from PaintScout (wins over reading)
    typed: Mapped[dict | None] = mapped_column(JSONB)         # fields typed by a person in PaintScout
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class IntakeDraft(TenantScoped, Versioned, Base):
    __tablename__ = "intake_draft"
    __extra_args__ = (tfk(["document_id"], "ops.estimate_document", "CASCADE"), tfk(["job_id"], "ops.job", "SET NULL"),
                      CheckConstraint("status in ('open','committed','discarded')", name="status"))
    document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    edit_job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))   # reserved: editing an existing job in the same form
    fields: Mapped[dict] = mapped_column(JSONB)
    sources: Mapped[dict] = mapped_column(JSONB)
    evidence: Mapped[dict] = mapped_column(JSONB)
    reader: Mapped[str] = mapped_column(Text)
    marked_text: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="open")
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
