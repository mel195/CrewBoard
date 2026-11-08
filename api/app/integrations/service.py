"""Connectors (stubs today), links to outside records, webhook signatures, and the outbox.

No connector talks to a real system yet (Phase 2: "No connector is built in this phase"). The interfaces are here
so each one can be filled in without touching the rest: outgoing calls are queued in the outbox and run by the
worker after the user's transaction commits; incoming webhooks are checked, stored, and processed by the worker.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.audit.service import record
from app.core.context import Ctx
from app.core.errors import AppError

from .models import PROVIDERS, ExternalRef, IntegrationConnection, OutboxJob

STUBS = {"paintscout": "Sold estimates come from the sample list until the PaintScout connector is built",
         "salesforce": "CRM accounts get a placeholder id until the Salesforce connector is built"}
SIGNATURE_TOLERANCE_S = 300


def resolve_secret(ref: str | None) -> str | None:
    """secret_ref names an entry in the secrets store. Locally that is the env var CREWBOARD_SECRET_<REF>."""
    if not ref:
        return None
    return os.environ.get("CREWBOARD_SECRET_" + ref.upper().replace("-", "_"))


def sign(secret: str, timestamp: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()


def verify(secret: str | None, timestamp: str | None, signature: str | None, body: bytes, now: datetime | None = None) -> None:
    if not secret:
        raise AppError(401, "webhook_not_configured", "This connector has no signing secret")
    if not timestamp or not signature:
        raise AppError(401, "bad_signature", "Missing signature headers")
    try:
        ts = int(timestamp)
    except ValueError:
        raise AppError(401, "bad_signature", "Bad timestamp")
    now = now or datetime.now(timezone.utc)
    if abs(now.timestamp() - ts) > SIGNATURE_TOLERANCE_S:
        raise AppError(401, "bad_signature", "Timestamp too old or in the future")
    if not hmac.compare_digest(sign(secret, timestamp, body), signature):
        raise AppError(401, "bad_signature", "Signature doesn't match")


async def connections(ctx: Ctx) -> list[dict]:
    rows = {c.provider: c for c in (await ctx.session.execute(select(IntegrationConnection))).scalars()}
    out = []
    for p in PROVIDERS:
        c = rows.get(p)
        status = c.status if c else ("stub" if p in STUBS else "not_connected")
        out.append({"provider": p, "status": status, "note": STUBS.get(p), "has_secret": bool(c and c.secret_ref),
                    "settings": c.settings if c else {}, "last_sync_at": c.last_sync_at if c else None})
    return out


async def set_connection(ctx: Ctx, provider: str, secret_ref: str | None, settings: dict | None) -> None:
    if provider not in PROVIDERS:
        raise AppError(404, "not_found", "Unknown connector")
    c = (await ctx.session.execute(select(IntegrationConnection).where(IntegrationConnection.provider == provider))).scalar_one_or_none()
    if c is None:
        c = IntegrationConnection(tenant_id=ctx.tenant_id, provider=provider, status="stub" if provider in STUBS else "not_connected")
        ctx.session.add(c)
    if secret_ref is not None:
        c.secret_ref = secret_ref or None
    if settings is not None:
        c.settings = settings
    await record(ctx, "Integration", f"Updated the {provider} connection settings.")


def enqueue(ctx: Ctx, kind: str, payload: dict) -> OutboxJob:
    j = OutboxJob(tenant_id=ctx.tenant_id, kind=kind, payload=payload)
    ctx.session.add(j)
    return j


async def crm_account(ctx: Ctx, client) -> tuple[ExternalRef, bool]:
    """Create the client's Salesforce account (CLI-04). Stub: a placeholder id, and an outbox job the connector will pick up."""
    ref = (await ctx.session.execute(select(ExternalRef).where(ExternalRef.provider == "salesforce", ExternalRef.entity_type == "client",
                                                                 ExternalRef.entity_id == client.id))).scalar_one_or_none()
    if ref:
        return ref, False
    ref = ExternalRef(tenant_id=ctx.tenant_id, entity_type="client", entity_id=client.id, provider="salesforce",
                      external_id="SF-" + secrets.token_hex(4).upper(), match_method="created")
    ctx.session.add(ref)
    await ctx.session.flush()
    enqueue(ctx, "salesforce.create_account", {"client_id": str(client.id), "external_ref_id": str(ref.id), "name": client.name})
    await record(ctx, "Integration", f"Created a Salesforce account for {client.name} ({ref.external_id}, placeholder until the connector is built).",
                 entity_type="client", entity_id=client.id)
    return ref, True


async def external_ids(ctx: Ctx, entity_type: str, entity_id: uuid.UUID) -> dict[str, str]:
    rows = (await ctx.session.execute(select(ExternalRef).where(ExternalRef.entity_type == entity_type, ExternalRef.entity_id == entity_id))).scalars()
    return {r.provider: r.external_id for r in rows}
