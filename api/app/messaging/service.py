"""Message batches: build from a decision, review, edit, send (log-only adapter), skip. MSG-01 to MSG-03, MSG-07."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.audit.service import record
from app.clients.models import Client
from app.core.context import Ctx
from app.core.errors import AppError, not_found
from app.crews.models import Crew
from app.geo.models import ServiceArea
from app.jobs.models import Job
from app.scheduling.engine.model import Snapshot
from app.scheduling.engine.ranking import hist
from app.settings.models import MessageTrigger, ProjectManager, RatingDimension, SchedulingRules
from app.trades.painting.models import PaintingColor, PaintingJob

from .builders import (DEFAULT_TRIGGERS, TRIGGERS, Msg, MsgCrew, MsgJob, MsgPm, build_color_messages, build_fixed_messages,
                       build_job_messages)
from .models import MessageBatch, OutboundMessage

CHANNELS = {"whatsapp": "WhatsApp", "text": "Text", "email": "Email"}


async def trigger_settings(ctx: Ctx) -> dict:
    rows = (await ctx.session.execute(select(MessageTrigger))).scalars().all()
    if not rows:
        return {k: dict(v) for k, v in DEFAULT_TRIGGERS.items()}
    out = {k: {r: False for r in ("crew", "client", "hoa", "pm")} for k in DEFAULT_TRIGGERS}
    for r in rows:
        out.setdefault(r.trigger, {})[r.recipient_role] = r.enabled
    return out


def company_name(ctx: Ctx) -> str:
    return ctx.tenant.message_name or ctx.tenant.name


async def msg_crews(ctx: Ctx, snap: Snapshot, crew_ids: list[str]) -> list[MsgCrew]:
    out = []
    for cid in crew_ids:
        c = await ctx.session.get(Crew, uuid.UUID(cid))
        h = hist(snap, cid)
        out.append(MsgCrew(id=cid, name=c.name, size=c.size_min, lead_language=c.lead_language, channel=c.channel, phone=c.phone,
                           cost_per_painter_day=h["costSold"] if h else None))
    return out


async def msg_job(ctx: Ctx, job: Job) -> MsgJob:
    s = ctx.session
    client = await s.get(Client, job.client_id) if job.client_id else None
    area = await s.get(ServiceArea, job.service_area_id)
    dim = await s.get(RatingDimension, job.job_type_id)
    p = (await s.execute(select(PaintingJob).where(PaintingJob.job_id == job.id))).scalar_one_or_none()
    colors = (await s.execute(select(PaintingColor).where(PaintingColor.job_id == job.id).order_by(PaintingColor.sort_order))).scalars().all()
    return MsgJob(title=job.title, client=client.name if client else "", area=area.name if area else "", type_key=dim.key, type_label=dim.label,
                  hours=float(job.sold_hours), ext=bool(p and p.is_exterior), hoa=bool(p and p.hoa), built=p.year_built if p else None,
                  colors=[c.color_name for c in colors], colors_confirmed=bool(p and p.colors_status == "confirmed"), lang=job.language)


async def msg_pm(ctx: Ctx, pm_id: uuid.UUID | None) -> MsgPm | None:
    if not pm_id:
        return None
    pm = await ctx.session.get(ProjectManager, pm_id)
    return MsgPm(name=pm.name, channel=pm.channel, phone=pm.phone) if pm else None


async def job_messages(ctx: Ctx, snap: Snapshot, job: Job, crew_ids: list[str], s: int, e: int, trigger: str, pm_id=None) -> list[Msg]:
    return build_job_messages(days=snap.days, company=company_name(ctx), triggers=await trigger_settings(ctx), avg_cost=snap.avg_cost,
                              job=await msg_job(ctx, job), crews=await msg_crews(ctx, snap, crew_ids), s=s, e=e, trigger=trigger,
                              pm=await msg_pm(ctx, pm_id))


async def fixed_messages(ctx: Ctx, snap: Snapshot, crew_id: str, name: str, what: str, s: int, e: int, trigger: str) -> list[Msg]:
    crew = (await msg_crews(ctx, snap, [crew_id]))[0]
    return build_fixed_messages(days=snap.days, company=company_name(ctx), triggers=await trigger_settings(ctx), crew=crew, name=name,
                                what=what, s=s, e=e, trigger=trigger)


async def color_messages(ctx: Ctx, snap: Snapshot, job: Job, crew_ids: list[str], s: int, pm_id=None) -> list[Msg]:
    return build_color_messages(days=snap.days, triggers=await trigger_settings(ctx), job=await msg_job(ctx, job),
                                crews=await msg_crews(ctx, snap, crew_ids), s=s, pm=await msg_pm(ctx, pm_id))


async def create_batch(ctx: Ctx, *, trigger: str, title: str, job: Job | None, msgs: list[Msg], decision_id=None) -> MessageBatch | None:
    """One review screen. If the tenant turned review off, the batch is sent at once (BL-55). No messages = no batch."""
    if not msgs:
        return None
    b = MessageBatch(tenant_id=ctx.tenant_id, trigger=trigger, title=title, job_id=job.id if job else None, decision_id=decision_id,
                     created_by=ctx.membership.id)
    ctx.session.add(b)
    await ctx.session.flush()
    for m in msgs:
        ctx.session.add(OutboundMessage(
            tenant_id=ctx.tenant_id, batch_id=b.id, trigger=trigger, job_id=job.id if job else None, job_title=job.title if job else None,
            client_id=job.client_id if job and m.role == "client" else None, crew_id=uuid.UUID(m.crew_id) if m.crew_id else None,
            recipient_key=m.key, recipient_role=m.role, recipient_name=m.to, channel=m.channel, language=m.lang, languages=m.langs,
            variants=m.variants, body=m.text, status="draft"))
    await ctx.session.flush()
    rules = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    if not rules.review_before_send:
        await send_batch(ctx, b)
    return b


async def batch_messages(ctx: Ctx, batch_id: uuid.UUID) -> list[OutboundMessage]:
    return (await ctx.session.execute(select(OutboundMessage).where(OutboundMessage.batch_id == batch_id).order_by(OutboundMessage.created_at,
                                                                                                                  OutboundMessage.recipient_key))).scalars().all()


async def get_batch(ctx: Ctx, batch_id: uuid.UUID) -> MessageBatch:
    b = await ctx.session.get(MessageBatch, batch_id)
    if not b:
        raise not_found("Message batch")
    return b


async def edit_message(ctx: Ctx, batch: MessageBatch, msg_id: uuid.UUID, body: str | None, channel: str | None, language: str | None) -> OutboundMessage:
    if batch.status != "draft":
        raise AppError(409, "batch_closed", "These messages were already sent or skipped")
    m = await ctx.session.get(OutboundMessage, msg_id)
    if not m or m.batch_id != batch.id:
        raise not_found("Message")
    if channel:
        m.channel = channel
    if language:
        if language not in m.languages:
            raise AppError(422, "validation_failed", f"This message can't be sent in {language}")
        m.language, m.body, m.edited = language, m.variants[language], False   # changing language regenerates the text
    if body is not None:
        if not body.strip():
            raise AppError(422, "validation_failed", "Write a message first")
        m.body, m.edited = body, body != m.variants.get(m.language)
    return m


async def send_batch(ctx: Ctx, batch: MessageBatch) -> MessageBatch:
    """Log-only delivery for now (DD-10): messages are recorded as `logged`, nothing leaves the system."""
    if batch.status != "draft":
        raise AppError(409, "batch_closed", "These messages were already sent or skipped")
    now = datetime.now(timezone.utc)
    msgs = await batch_messages(ctx, batch.id)
    for m in msgs:
        m.status, m.sent_by, m.sent_at = "logged", ctx.actor_label, now
    batch.status, batch.sent_at = "sent", now
    n = len(msgs)
    await record(ctx, "Message", f"Sent {n} message{'' if n == 1 else 's'} ({TRIGGERS.get(batch.trigger, batch.trigger).lower()}) for "
                                 f"{msgs[0].job_title or batch.title}: " + "; ".join(f"{m.recipient_name} by {CHANNELS[m.channel]}" for m in msgs) + ".",
                 entity_type="message_batch", entity_id=batch.id, job_id=batch.job_id)
    return batch


async def skip_batch(ctx: Ctx, batch: MessageBatch) -> MessageBatch:
    if batch.status != "draft":
        raise AppError(409, "batch_closed", "These messages were already sent or skipped")
    for m in await batch_messages(ctx, batch.id):
        m.status = "skipped"
    batch.status = "skipped"
    return batch
