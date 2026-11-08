"""Clients: search, record, edit, add, follow-ups (CLI-01 to CLI-03, CLI-06)."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Header, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.audit.service import record
from app.core.context import Ctx, check_version, tenant_ctx
from app.core.errors import AppError, not_found

from .models import Client, ClientSignal, FollowUp

router = APIRouter(tags=["clients"])


class SignalOut(BaseModel):
    returning_since: str | None = None
    referral_count: int = 0
    crm_vip: bool = False
    trade_type: str | None = None


class FollowUpOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    due_date: date
    note: str
    done_at: datetime | None


class ClientOut(BaseModel):
    id: uuid.UUID
    name: str
    first_name: str
    phone: str | None
    email: str | None
    channel: str
    language: str
    address: str | None
    service_area_id: uuid.UUID | None
    notes: str
    signals: SignalOut | None = None
    follow_ups: list[FollowUpOut] = []
    version: int


class ClientIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    first_name: str | None = None
    phone: str | None = None
    email: str | None = None
    channel: str = Field("text", pattern="^(text|email|whatsapp)$")
    language: str = Field("en", pattern="^(en|es|pt|ht)$")
    address: str | None = None
    service_area_id: uuid.UUID | None = None
    notes: str = ""


class ClientPatch(BaseModel):
    first_name: str | None = None
    phone: str | None = None
    email: str | None = None
    channel: str | None = Field(None, pattern="^(text|email|whatsapp)$")
    language: str | None = Field(None, pattern="^(en|es|pt|ht)$")
    address: str | None = None
    notes: str | None = None


class FollowUpIn(BaseModel):
    due_date: date
    note: str = ""


async def _out(ctx: Ctx, c: Client, detail: bool = False) -> ClientOut:
    sig = (await ctx.session.execute(select(ClientSignal).where(ClientSignal.client_id == c.id))).scalar_one_or_none()
    fus = []
    if detail:
        fus = (await ctx.session.execute(select(FollowUp).where(FollowUp.client_id == c.id).order_by(FollowUp.due_date))).scalars().all()
    return ClientOut(id=c.id, name=c.name, first_name=c.first_name, phone=c.phone, email=c.email, channel=c.channel, language=c.language,
                     address=c.address, service_area_id=c.service_area_id, notes=c.notes, version=c.version,
                     signals=SignalOut(returning_since=sig.returning_since, referral_count=sig.referral_count, crm_vip=sig.crm_vip,
                                       trade_type=sig.trade_type) if sig else None,
                     follow_ups=[FollowUpOut.model_validate(f) for f in fus])


@router.get("/clients", response_model=list[ClientOut], operation_id="clients_list")
async def search(q: str | None = None, limit: int = 50, ctx: Ctx = Depends(tenant_ctx)):
    stmt = select(Client).where(Client.archived_at.is_(None)).order_by(Client.name).limit(min(limit, 200))
    if q:
        stmt = stmt.where(Client.name.ilike(f"%{q}%"))
    return [await _out(ctx, c) for c in (await ctx.session.execute(stmt)).scalars()]


@router.post("/clients", response_model=ClientOut, status_code=201, operation_id="clients_create")
async def create(body: ClientIn, ctx: Ctx = Depends(tenant_ctx)):
    c = Client(tenant_id=ctx.tenant_id, **body.model_dump(exclude={"first_name"}), first_name=body.first_name or body.name.split(" ")[0])
    ctx.session.add(c)
    await ctx.session.flush()
    # CRM matching is a stub until the Salesforce connector exists (CLI-03, CLI-04).
    await record(ctx, "Edit", f"Added client {c.name}.", entity_type="client", entity_id=c.id)
    return await _out(ctx, c, True)


async def _get(ctx: Ctx, cid: uuid.UUID) -> Client:
    c = await ctx.session.get(Client, cid)
    if not c or c.archived_at:
        raise not_found("Client")
    return c


@router.get("/clients/{client_id}", response_model=ClientOut, operation_id="clients_get")
async def get(client_id: uuid.UUID, response: Response, ctx: Ctx = Depends(tenant_ctx)):
    c = await _get(ctx, client_id)
    response.headers["ETag"] = f'"{c.version}"'
    return await _out(ctx, c, True)


@router.patch("/clients/{client_id}", response_model=ClientOut, operation_id="clients_update")
async def update(client_id: uuid.UUID, body: ClientPatch, response: Response, if_match: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    c = await _get(ctx, client_id)
    check_version(c.version, if_match)
    changed = [k for k, v in body.model_dump(exclude_unset=True).items() if getattr(c, k) != v]
    for k in changed:
        setattr(c, k, getattr(body, k))
    if changed:
        c.version += 1
        await record(ctx, "Edit", f"Updated client {c.name}: {', '.join(changed)}.", entity_type="client", entity_id=c.id)
    response.headers["ETag"] = f'"{c.version}"'
    return await _out(ctx, c, True)


@router.post("/clients/{client_id}/follow-ups", response_model=FollowUpOut, status_code=201, operation_id="clients_followups_create")
async def add_follow_up(client_id: uuid.UUID, body: FollowUpIn, ctx: Ctx = Depends(tenant_ctx)):
    c = await _get(ctx, client_id)
    f = FollowUp(tenant_id=ctx.tenant_id, client_id=c.id, due_date=body.due_date, note=body.note or f"Follow up with {c.first_name}")
    ctx.session.add(f)
    await ctx.session.flush()
    await record(ctx, "Edit", f"Set a follow-up for {c.name} on {body.due_date:%a %b %-d}.", entity_type="client", entity_id=c.id)
    return FollowUpOut.model_validate(f)


@router.post("/follow-ups/{follow_up_id}/done", response_model=FollowUpOut, operation_id="followups_done")
async def follow_up_done(follow_up_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    f = await ctx.session.get(FollowUp, follow_up_id)
    if not f:
        raise not_found("Follow-up")
    f.done_at, f.done_by = datetime.now(timezone.utc), ctx.membership.id
    return FollowUpOut.model_validate(f)
