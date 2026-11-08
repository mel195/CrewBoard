"""Idempotency keys for actions that must not run twice (confirm, move, unschedule, send). Kept 24 hours."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, Integer, Text, UniqueConstraint, delete, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped

from .context import Ctx
from .errors import AppError


class IdempotencyKey(TenantScoped, Base):
    __tablename__ = "idempotency_key"
    __schema__ = "system"
    __extra_args__ = (UniqueConstraint("tenant_id", "key"),)
    key: Mapped[str] = mapped_column(Text)
    request_hash: Mapped[str] = mapped_column(Text)
    status_code: Mapped[int] = mapped_column(Integer)
    response: Mapped[dict] = mapped_column(JSONB)


def _hash(path: str, body) -> str:
    return hashlib.sha256((path + json.dumps(body, sort_keys=True, default=str)).encode()).hexdigest()


async def lookup(ctx: Ctx, key: str | None, path: str, body) -> dict | None:
    if not key:
        raise AppError(428, "idempotency_key_required", "Send an Idempotency-Key header for this action")
    row = (await ctx.session.execute(select(IdempotencyKey).where(IdempotencyKey.key == key))).scalar_one_or_none()
    if not row:
        return None
    if row.created_at < datetime.now(timezone.utc) - timedelta(hours=24):
        await ctx.session.delete(row)
        await ctx.session.flush()
        return None
    if row.request_hash != _hash(path, body):
        raise AppError(409, "idempotency_mismatch", "That Idempotency-Key was used for a different request")
    return row.response


async def store(ctx: Ctx, key: str, path: str, body, response: dict, status_code: int = 200) -> None:
    ctx.session.add(IdempotencyKey(tenant_id=ctx.tenant_id, key=key, request_hash=_hash(path, body), status_code=status_code, response=response))
