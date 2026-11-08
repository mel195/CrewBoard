"""Message review, send, skip, log, trigger settings, project managers (MSG-01 to MSG-07, BRD-07)."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.audit.service import record
from app.core import idempotency
from app.core.context import Ctx, require, tenant_ctx
from app.core.errors import AppError
from app.settings.models import MessageTrigger, ProjectManager

from . import service as svc
from .builders import DEFAULT_TRIGGERS, TRIGGERS
from .models import MessageBatch, OutboundMessage

router = APIRouter(tags=["messages"])


class MessageOut(BaseModel):
    id: uuid.UUID
    trigger: str
    job_id: uuid.UUID | None
    job_title: str | None
    recipient_role: str
    recipient_name: str
    channel: str
    language: str
    languages: list[str]
    body: str
    generated_body: str
    edited: bool
    status: str
    sent_by: str | None
    sent_at: datetime | None
    created_at: datetime


class BatchOut(BaseModel):
    id: uuid.UUID
    trigger: str
    title: str
    job_id: uuid.UUID | None
    status: str
    messages: list[MessageOut]


def message_out(m: OutboundMessage) -> MessageOut:
    return MessageOut(id=m.id, trigger=m.trigger, job_id=m.job_id, job_title=m.job_title, recipient_role=m.recipient_role,
                      recipient_name=m.recipient_name, channel=m.channel, language=m.language, languages=m.languages, body=m.body,
                      generated_body=m.variants.get(m.language, m.body), edited=m.edited, status=m.status, sent_by=m.sent_by,
                      sent_at=m.sent_at, created_at=m.created_at)


async def batch_out(ctx: Ctx, b: MessageBatch | None) -> BatchOut | None:
    if b is None:
        return None
    await ctx.session.flush()
    msgs = await svc.batch_messages(ctx, b.id)
    for m in msgs:
        await ctx.session.refresh(m)
    return BatchOut(id=b.id, trigger=b.trigger, title=b.title, job_id=b.job_id, status=b.status, messages=[message_out(m) for m in msgs])


@router.get("/message-batches/{batch_id}", response_model=BatchOut, operation_id="message_batches_get")
async def get_batch(batch_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    return await batch_out(ctx, await svc.get_batch(ctx, batch_id))


class MessageEdit(BaseModel):
    body: str | None = None
    channel: str | None = Field(None, pattern="^(text|email|whatsapp)$")
    language: str | None = Field(None, pattern="^(en|es|pt|ht)$")


@router.patch("/message-batches/{batch_id}/messages/{message_id}", response_model=MessageOut, operation_id="message_batches_edit_message")
async def edit_message(batch_id: uuid.UUID, message_id: uuid.UUID, body: MessageEdit, ctx: Ctx = Depends(tenant_ctx)):
    b = await svc.get_batch(ctx, batch_id)
    m = await svc.edit_message(ctx, b, message_id, body.body, body.channel, body.language)
    await ctx.session.flush()
    await ctx.session.refresh(m)
    return message_out(m)


@router.post("/message-batches/{batch_id}/send", response_model=BatchOut, operation_id="message_batches_send")
async def send(batch_id: uuid.UUID, request: Request, idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, {})
    if prev is not None:
        return prev
    b = await svc.send_batch(ctx, await svc.get_batch(ctx, batch_id))
    out = (await batch_out(ctx, b)).model_dump(mode="json")
    await idempotency.store(ctx, idempotency_key, request.url.path, {}, out)
    return out


@router.post("/message-batches/{batch_id}/skip", response_model=BatchOut, operation_id="message_batches_skip")
async def skip(batch_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    return await batch_out(ctx, await svc.skip_batch(ctx, await svc.get_batch(ctx, batch_id)))


@router.get("/messages", response_model=list[MessageOut], operation_id="messages_list")
async def log(role: str | None = None, crew_id: uuid.UUID | None = None, job_id: uuid.UUID | None = None, limit: int = 100,
              ctx: Ctx = Depends(tenant_ctx)):
    """Message log: everything sent (logged), newest first (MSG-04)."""
    q = select(OutboundMessage).where(OutboundMessage.status.in_(("logged", "sent", "queued", "failed"))) \
        .order_by(OutboundMessage.sent_at.desc().nullslast(), OutboundMessage.created_at.desc()).limit(min(limit, 500))
    if role:
        q = q.where(OutboundMessage.recipient_role == role)
    if crew_id:
        q = q.where(OutboundMessage.crew_id == crew_id)
    if job_id:
        q = q.where(OutboundMessage.job_id == job_id)
    return [message_out(m) for m in (await ctx.session.execute(q)).scalars()]


# ---------- settings: triggers (MSG-07) ----------

class TriggersOut(BaseModel):
    review_before_send: bool
    triggers: dict[str, dict[str, bool]]


@router.get("/settings/message-triggers", response_model=TriggersOut, operation_id="settings_message_triggers_get")
async def get_triggers(ctx: Ctx = Depends(tenant_ctx)):
    from app.settings.models import SchedulingRules
    r = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    return TriggersOut(review_before_send=r.review_before_send, triggers=await svc.trigger_settings(ctx))


@router.put("/settings/message-triggers", response_model=TriggersOut, operation_id="settings_message_triggers_put")
async def put_triggers(body: TriggersOut, ctx: Ctx = Depends(require("admin"))):
    from app.settings.models import SchedulingRules
    r = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    if r.review_before_send != body.review_before_send:
        r.review_before_send = body.review_before_send
        r.version += 1
        await record(ctx, "Setting", f"Review messages before sending: {'on' if body.review_before_send else 'off'}.")
    rows = {(x.trigger, x.recipient_role): x for x in (await ctx.session.execute(select(MessageTrigger))).scalars()}
    for trig, roles in body.triggers.items():
        if trig not in DEFAULT_TRIGGERS:
            raise AppError(422, "validation_failed", f"Unknown trigger {trig}")
        for role, on in roles.items():
            if role not in ("crew", "client", "hoa", "pm"):
                raise AppError(422, "validation_failed", f"Unknown recipient {role}")
            row = rows.get((trig, role))
            if row is None:
                row = MessageTrigger(tenant_id=ctx.tenant_id, trigger=trig, recipient_role=role, enabled=on)
                ctx.session.add(row)
            if row.enabled != on or row.id is None:
                row.enabled = on
                await record(ctx, "Setting", f"{TRIGGERS[trig]}: {'crew lead' if role == 'crew' else role} messages {'on' if on else 'off'}.")
    await ctx.session.flush()
    return await get_triggers(ctx)


# ---------- project managers (BRD-07) ----------

class PmIn(BaseModel):
    name: str = Field(min_length=1)
    phone: str | None = None
    email: str | None = None
    channel: str = Field("text", pattern="^(text|email|whatsapp)$")
    language: str = Field("en", pattern="^(en|es|pt|ht)$")


class PmOut(PmIn):
    id: uuid.UUID


@router.get("/project-managers", response_model=list[PmOut], operation_id="project_managers_list")
async def pms(ctx: Ctx = Depends(tenant_ctx)):
    rows = (await ctx.session.execute(select(ProjectManager).order_by(ProjectManager.name))).scalars()
    return [PmOut(id=p.id, name=p.name, phone=p.phone, email=p.email, channel=p.channel, language=p.language) for p in rows]


@router.post("/project-managers", response_model=PmOut, status_code=201, operation_id="project_managers_create")
async def add_pm(body: PmIn, ctx: Ctx = Depends(require("admin"))):
    if (await ctx.session.execute(select(ProjectManager).where(ProjectManager.name == body.name))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That name is taken")
    p = ProjectManager(tenant_id=ctx.tenant_id, **body.model_dump())
    ctx.session.add(p)
    await ctx.session.flush()
    await record(ctx, "Setting", f"Added project manager {p.name}.")
    return PmOut(id=p.id, **body.model_dump())
