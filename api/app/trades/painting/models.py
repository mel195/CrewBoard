"""Painting-specific job details (schema `painting`)."""
from __future__ import annotations

import uuid

from sqlalchemy import Boolean, CheckConstraint, SmallInteger, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class PaintingJob(TenantScoped, Base):
    __tablename__ = "painting_job"
    __schema__ = "painting"
    __extra_args__ = (UniqueConstraint("job_id"), tfk(["job_id"], "ops.job", "CASCADE"),
                      CheckConstraint("colors_status in ('tbd','sent','confirmed')", name="colors"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    year_built: Mapped[int | None] = mapped_column(SmallInteger)
    is_exterior: Mapped[bool] = mapped_column(Boolean, default=False)
    hoa: Mapped[bool] = mapped_column(Boolean, default=False)
    hoa_quiet_hours: Mapped[str | None] = mapped_column(Text)
    colors_status: Mapped[str] = mapped_column(Text, default="tbd")
    scope_lines: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    work_order_notes: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)


class PaintingColor(TenantScoped, Base):
    __tablename__ = "painting_color"
    __schema__ = "painting"
    __extra_args__ = (tfk(["job_id"], "ops.job", "CASCADE"),)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    surface: Mapped[str | None] = mapped_column(Text)
    color_name: Mapped[str] = mapped_column(Text)
    color_code: Mapped[str | None] = mapped_column(Text)
    hex: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(SmallInteger, default=0)
