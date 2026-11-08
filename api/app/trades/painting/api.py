"""Painting job colors: edit them, mark them confirmed (crew leads and PM get a heads-up), text the client the color form (BRD-12, Q-06)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy import delete, select

from app.audit.service import record
from app.clients.models import Client
from app.core import idempotency
from app.core.context import Ctx, tenant_ctx
from app.core.errors import AppError, not_found
from app.jobs.models import Job
from app.messaging.api import BatchOut, batch_out
from app.messaging.builders import Msg
from app.messaging.service import color_messages, company_name, create_batch
from app.messaging.templates_api import LINK_BASE
from app.scheduling.models import Placement, PlacementCrew, PlacementVisit
from app.scheduling.snapshot import load_snapshot

from .models import PaintingColor, PaintingJob

router = APIRouter(tags=["painting"])

# The prototype's "Colors and materials needed" template, with the form link added (a change from the prototype, listed in the README: the color form now sends a message)
COLOR_FORM = {
    "en": "Hi {first}, it’s {company}. We still need your color and material picks for {job} before we start. Pick them here: {link}",
    "es": "Hola {first}, le escribe {company}. Todavía necesitamos su selección de colores y materiales para {job} antes de comenzar. Elíjalos aquí: {link}",
    "ht": "Bonjou {first}, se {company}. Nou toujou bezwen chwa koulè ak materyèl ou pou {job} anvan nou kòmanse. Chwazi yo isit la: {link}",
    "pt": "Oi {first}, aqui é a {company}. Ainda precisamos da sua escolha de cores e materiais para {job} antes de começar. Escolha aqui: {link}",
}


class ColorIn(BaseModel):
    surface: str | None = None
    name: str = Field(min_length=1)
    code: str | None = None
    hex: str | None = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class ColorsIn(BaseModel):
    colors: list[ColorIn] | None = None
    status: str | None = Field(None, pattern="^(tbd|sent|confirmed)$")


class ColorsOut(BaseModel):
    job_id: uuid.UUID
    status: str
    colors: list[ColorIn]
    message_batch: BatchOut | None = None


async def _painting(ctx: Ctx, job_id: uuid.UUID) -> tuple[Job, PaintingJob]:
    job = await ctx.session.get(Job, job_id)
    if not job:
        raise not_found("Job")
    p = (await ctx.session.execute(select(PaintingJob).where(PaintingJob.job_id == job.id))).scalar_one_or_none()
    if not p:
        p = PaintingJob(tenant_id=ctx.tenant_id, job_id=job.id)
        ctx.session.add(p)
        await ctx.session.flush()
    return job, p


async def _colors(ctx: Ctx, job_id: uuid.UUID) -> list[PaintingColor]:
    return (await ctx.session.execute(select(PaintingColor).where(PaintingColor.job_id == job_id).order_by(PaintingColor.sort_order))).scalars().all()


@router.put("/jobs/{job_id}/colors", response_model=ColorsOut, operation_id="jobs_colors_put")
async def put_colors(job_id: uuid.UUID, body: ColorsIn, ctx: Ctx = Depends(tenant_ctx)):
    """Replace the colors and/or set the status. Marking them confirmed on a placed job prepares the "Colors confirmed" messages."""
    s = ctx.session
    job, p = await _painting(ctx, job_id)
    if body.colors is not None:
        await s.execute(delete(PaintingColor).where(PaintingColor.job_id == job.id))
        for i, c in enumerate(body.colors):
            s.add(PaintingColor(tenant_id=ctx.tenant_id, job_id=job.id, surface=c.surface, color_name=c.name, color_code=c.code, hex=c.hex, sort_order=i))
        await s.flush()
        await record(ctx, "Edit", f"Updated the colors for {job.title}.", entity_type="job", entity_id=job.id, job_id=job.id)
    batch = None
    if body.status and body.status != p.colors_status:
        cols = await _colors(ctx, job.id)
        if body.status == "confirmed" and not cols:
            raise AppError(422, "no_colors", "Add the colors first")
        p.colors_status = body.status
        await s.flush()
        if body.status == "confirmed":
            await record(ctx, "Edit", f"Colors confirmed for {job.title}: {', '.join(c.color_name for c in cols)}.", entity_type="job", entity_id=job.id, job_id=job.id)
            batch = await _confirmed_batch(ctx, job)
    cols = await _colors(ctx, job.id)
    return ColorsOut(job_id=job.id, status=p.colors_status, colors=[ColorIn(surface=c.surface, name=c.color_name, code=c.color_code, hex=c.hex) for c in cols],
                     message_batch=await batch_out(ctx, batch))


async def _confirmed_batch(ctx: Ctx, job: Job):
    pl = (await ctx.session.execute(select(Placement).where(Placement.job_id == job.id))).scalar_one_or_none()
    if not pl:
        return None
    crews = (await ctx.session.execute(select(PlacementCrew).where(PlacementCrew.placement_id == pl.id))).scalars().all()
    crew_ids = [str(c.crew_id) for c in sorted(crews, key=lambda c: c.role != "lead")]
    first = (await ctx.session.execute(select(PlacementVisit).where(PlacementVisit.placement_id == pl.id).order_by(PlacementVisit.seq))).scalars().first()
    L = await load_snapshot(ctx)
    start = max(0, min(L.index(first.start_date), len(L.snap.days) - 1)) if first else 0
    msgs = await color_messages(ctx, L.snap, job, crew_ids, start, pl.pm_id)
    return await create_batch(ctx, trigger="colors", title=f"Colors confirmed for {job.title}", job=job, msgs=msgs)


@router.post("/jobs/{job_id}/color-form", response_model=BatchOut, operation_id="jobs_color_form")
async def color_form(job_id: uuid.UUID, request: Request, idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    """Text the client the color form. Builds a client message for review, and marks the colors as sent."""
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, {})
    if prev is not None:
        return prev
    job, p = await _painting(ctx, job_id)
    if p.colors_status == "confirmed":
        raise AppError(422, "colors_confirmed", "The colors are already confirmed")
    c = await ctx.session.get(Client, job.client_id) if job.client_id else None
    if not c:
        raise AppError(422, "no_client", "This job has no client to text")
    link = f"{LINK_BASE}{str(c.id)[:8]}/colors/{str(job.id)[:8]}"
    def fill(t):
        return t.replace("{first}", c.first_name or "there").replace("{company}", company_name(ctx)).replace("{job}", job.title).replace("{link}", link)
    m = Msg(key="client", role="client", to=f"{c.name} (client)", channel=c.channel, lang=c.language if c.language in COLOR_FORM else "en",
            langs=list(COLOR_FORM))
    m.variants = {l: fill(t) for l, t in COLOR_FORM.items()}
    p.colors_status = "sent"
    batch = await create_batch(ctx, trigger="color_form", title=f"Color form for {job.title}", job=job, msgs=[m])
    await record(ctx, "Edit", f"Texted {c.name} the color form for {job.title}.", entity_type="job", entity_id=job.id, job_id=job.id)
    out = (await batch_out(ctx, batch)).model_dump(mode="json")
    await idempotency.store(ctx, idempotency_key, request.url.path, {}, out)
    return out
