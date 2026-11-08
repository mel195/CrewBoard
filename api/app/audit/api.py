"""Audit log search and CSV export (AUD-01, AUD-03). Admins only, as in the prototype."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import select

from app.core.context import Ctx, require

from .models import AuditEvent

router = APIRouter(tags=["audit"])
TYPES = ("Decision", "Override", "Edit", "Import", "Crew data", "Setting", "Export", "Riley", "Optimizer", "Message", "Integration")


class AuditOut(BaseModel):
    id: uuid.UUID
    occurred_at: datetime
    actor: str
    type: str
    text: str
    entity_type: str | None
    entity_id: uuid.UUID | None
    job_id: uuid.UUID | None
    detail: dict | None


async def _rows(ctx: Ctx, frm: date | None, to: date | None, types: list[str] | None, q: str | None, job_id: uuid.UUID | None, limit: int):
    stmt = select(AuditEvent).order_by(AuditEvent.occurred_at.desc(), AuditEvent.id).limit(min(limit, 5000))
    if frm:
        stmt = stmt.where(AuditEvent.occurred_at >= datetime.combine(frm, time.min))
    if to:
        stmt = stmt.where(AuditEvent.occurred_at < datetime.combine(to + timedelta(days=1), time.min))
    if types:
        stmt = stmt.where(AuditEvent.type.in_(types))
    if q:
        stmt = stmt.where(AuditEvent.text.ilike(f"%{q}%"))
    if job_id:
        stmt = stmt.where(AuditEvent.job_id == job_id)
    return (await ctx.session.execute(stmt)).scalars().all()


def _out(e: AuditEvent) -> AuditOut:
    return AuditOut(id=e.id, occurred_at=e.occurred_at, actor=e.actor_label, type=e.type, text=e.text, entity_type=e.entity_type,
                    entity_id=e.entity_id, job_id=e.job_id, detail=e.detail)


@router.get("/audit-events", operation_id="audit_events_list")
async def events(from_: date | None = Query(None, alias="from"), to: date | None = None, type: list[str] | None = Query(None),
                 q: str | None = None, job_id: uuid.UUID | None = None, limit: int = 500, ctx: Ctx = Depends(require("admin"))):
    """Newest first. Filter by date range, one or more types, text, or job."""
    return {"types": list(TYPES), "items": [_out(e) for e in await _rows(ctx, from_, to, type, q, job_id, limit)]}


@router.get("/audit-events.csv", response_class=PlainTextResponse, operation_id="audit_events_csv")
async def events_csv(from_: date | None = Query(None, alias="from"), to: date | None = None, type: list[str] | None = Query(None),
                     q: str | None = None, job_id: uuid.UUID | None = None, ctx: Ctx = Depends(require("admin"))):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["When", "Who", "Type", "What"])
    for e in await _rows(ctx, from_, to, type, q, job_id, 5000):
        w.writerow([e.occurred_at.isoformat(timespec="seconds"), e.actor_label, e.type, e.text])
    return PlainTextResponse(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="crewboard-audit-log.csv"'})
