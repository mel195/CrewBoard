from __future__ import annotations

import json
import uuid
from decimal import Decimal

from app.core.context import Ctx

from .models import AuditEvent


async def record(ctx: Ctx, type_: str, text: str, *, entity_type: str | None = None, entity_id: uuid.UUID | None = None,
                 job_id: uuid.UUID | None = None, detail: dict | None = None) -> None:
    """Write an audit event in the caller's transaction (AUD-04)."""
    if detail is not None:
        detail = json.loads(json.dumps(detail, default=lambda o: float(o) if isinstance(o, Decimal) else str(o)))
    ctx.session.add(AuditEvent(tenant_id=ctx.tenant_id, actor_id=ctx.membership.id if ctx.membership else None,
                               actor_label=ctx.actor_label, type=type_, entity_type=entity_type, entity_id=entity_id,
                               job_id=job_id, text=text, detail=detail))
