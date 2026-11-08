"""Connectors, CRM account stub and the webhook receiver (SET-08, CLI-04, ADD-12)."""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select

from app.clients.models import Client
from app.core.context import Ctx, require, tenant_ctx
from app.core.db import sessionmaker, set_tenant
from app.core.errors import AppError, not_found
from app.platform.models import Tenant

from . import service as svc
from .models import PROVIDERS, IntegrationConnection, OutboxJob

router = APIRouter(tags=["integrations"])
MAX_WEBHOOK_BYTES = 1024 * 1024


@router.get("/integrations", operation_id="integrations_list")
async def list_connections(ctx: Ctx = Depends(require("admin"))):
    """Every connector and its state. Today they are all stubs or not connected."""
    return await svc.connections(ctx)


class ConnectionIn(BaseModel):
    secret_ref: str | None = None   # name of the secret in the secrets store, never the secret itself
    settings: dict | None = None


@router.put("/integrations/{provider}", operation_id="integrations_put")
async def put_connection(provider: str, body: ConnectionIn, ctx: Ctx = Depends(require("admin"))):
    await svc.set_connection(ctx, provider, body.secret_ref, body.settings)
    return next(c for c in await svc.connections(ctx) if c["provider"] == provider)


class CrmOut(BaseModel):
    provider: str
    external_id: str
    created: bool


@router.post("/clients/{client_id}/crm-account", response_model=CrmOut, operation_id="clients_crm_account")
async def crm_account(client_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    """Create the client in Salesforce. Stub until the connector exists: returns a placeholder id. Calling again returns the same id."""
    c = await ctx.session.get(Client, client_id)
    if not c or c.archived_at:
        raise not_found("Client")
    ref, created = await svc.crm_account(ctx, c)
    return CrmOut(provider="salesforce", external_id=ref.external_id, created=created)


@router.post("/integrations/{provider}/webhook", status_code=202, operation_id="integrations_webhook", tags=["integrations"])
async def webhook(provider: str, request: Request, x_tenant_id: str | None = Header(None),
                  x_crewboard_timestamp: str | None = Header(None), x_crewboard_signature: str | None = Header(None)):
    """Incoming events (message replies, sold estimates). No user sign-in: the request is signed with the connector's
    secret (HMAC-SHA256 over "<timestamp>.<body>", header `X-Crewboard-Signature: sha256=<hex>`). It is stored and
    processed later by the worker."""
    if provider not in PROVIDERS:
        raise not_found("Connector")
    body = await request.body()
    if len(body) > MAX_WEBHOOK_BYTES:
        raise AppError(413, "payload_too_large", "Webhook payloads can be up to 1 MB")
    try:
        tid = uuid.UUID(x_tenant_id or "")
    except ValueError:
        raise AppError(400, "invalid_request", "X-Tenant-Id must be a UUID")
    async with sessionmaker()() as s:
        async with s.begin():
            await set_tenant(s, tid)
            if not await s.get(Tenant, tid):
                raise not_found("Workspace")
            conn = (await s.execute(select(IntegrationConnection).where(IntegrationConnection.provider == provider))).scalar_one_or_none()
            svc.verify(svc.resolve_secret(conn.secret_ref if conn else None), x_crewboard_timestamp, x_crewboard_signature, body)
            try:
                payload = json.loads(body) if body else None
            except ValueError:
                payload = body.decode("utf-8", "replace")
            j = OutboxJob(tenant_id=tid, kind=f"webhook.{provider}", payload={"body": payload, "content_type": request.headers.get("content-type")})
            s.add(j)
            await s.flush()
            jid = j.id
    return JSONResponse({"id": str(jid), "status": "stored"}, status_code=202)
