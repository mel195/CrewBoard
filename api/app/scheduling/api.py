"""Queue, job detail, ranking, KPIs: the read side of scheduling (Q-01, Q-03, MAT-01 to MAT-08, MAT-11).

Placement writes (place, drag, confirm, move, unschedule) are build step 3.
"""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select

from app.assistant.engine import riley_pick
from app.audit.service import record
from app.core.context import Ctx, require, tenant_ctx
from app.core.errors import AppError, not_found
from app.jobs.models import Job, JobRanking
from app.optimizer.engine import margin
from app.settings.models import RankingLabel
from app.trades.painting.models import PaintingColor, PaintingJob

from .engine.core import Span, earliest_slot, painter_days
from .engine.planning import kpi_sched, kpi_waiting, open_days
from .engine.ranking import RankRow, imp_why, label_for, rank, weights, why_lines
from .snapshot import LoadedSnapshot, load_snapshot

router = APIRouter(tags=["scheduling"])


class RuleFailureOut(BaseModel):
    code: str
    message: str


class SlotOut(BaseModel):
    start: date
    end: date
    half_day: str | None
    rain_holds: list[date]
    conflicts: list[date]
    crew_days: int


class RankRowOut(BaseModel):
    crew_id: uuid.UUID
    crew_name: str
    ok: bool
    failures: list[RuleFailureOut]
    slot: SlotOut | None
    factors: dict[str, float]
    score: int
    needs_rating: bool
    why: list[str]
    weakness: str | None
    margin_pct: int | None


class RileyPickOut(BaseModel):
    crew_id: uuid.UUID
    crew_name: str
    why: str
    pattern: bool


class RankingOut(BaseModel):
    job_id: uuid.UUID
    label: str
    custom: bool
    weights: dict[str, float]
    important: list[str]
    rows: list[RankRowOut]
    closest: list[uuid.UUID]
    riley_pick: RileyPickOut | None


def _slot(L: LoadedSnapshot, sp: Span | None) -> SlotOut | None:
    if not sp:
        return None
    return SlotOut(start=L.date(sp.s), end=L.date(sp.e), half_day=sp.half, rain_holds=[L.date(d) for d in sp.holds],
                   conflicts=[L.date(d) for d in sp.conf], crew_days=sp.n)


def _row(L: LoadedSnapshot, jid: str, r: RankRow) -> RankRowOut:
    w = why_lines(L.snap, L.snap.jobs[jid], r)
    return RankRowOut(crew_id=uuid.UUID(r.crew), crew_name=L.crew_names[r.crew], ok=r.ok,
                      failures=[RuleFailureOut(code=f.code, message=f.message) for f in r.fails], slot=_slot(L, r.slot),
                      factors=r.f, score=r.score, needs_rating=r.needs_rating, why=w["plus"], weakness=w["minus"],
                      margin_pct=margin(L.snap, jid, r.crew))


async def _loaded_job(ctx: Ctx, job_id: uuid.UUID) -> tuple[LoadedSnapshot, str]:
    L = await load_snapshot(ctx)
    jid = str(job_id)
    if jid not in L.snap.jobs:
        if await ctx.session.get(Job, job_id):
            raise AppError(422, "not_in_queue", "This job isn't in the Ready to schedule queue")
        raise not_found("Job")
    return L, jid


@router.get("/jobs/{job_id}/ranking", response_model=RankingOut, operation_id="jobs_ranking_get")
async def ranking(job_id: uuid.UUID, label: str | None = None, ctx: Ctx = Depends(tenant_ctx)):
    """Every active crew ranked for a job (MAT-03), the 3 closest passing crews (MAT-02) and Riley's pick (MAT-11)."""
    L, jid = await _loaded_job(ctx, job_id)
    snap = L.snap
    if label:
        if label not in snap.labels:
            raise not_found("Label")
        snap.job_label[jid] = label
        snap.job_weights.pop(jid, None)
    rows = rank(snap, jid)
    job = snap.jobs[jid]
    from .engine.ranking import drive_min
    passing = [r for r in rows if r.ok]
    closest = sorted([r for r in passing if drive_min(snap, snap.crew(r.crew).base, job.area) is not None],
                     key=lambda r: drive_min(snap, snap.crew(r.crew).base, job.area))[:3]
    rp = riley_pick(snap, jid, rows)
    return RankingOut(job_id=job_id, label=label_for(snap, jid), custom=jid in snap.job_weights, weights=weights(snap, jid),
                      important=imp_why(snap, job), rows=[_row(L, jid, r) for r in rows], closest=[uuid.UUID(r.crew) for r in closest],
                      riley_pick=RileyPickOut(crew_id=uuid.UUID(rp["crew"]), crew_name=L.crew_names[rp["crew"]], why=rp["why"],
                                              pattern=rp["pattern"]) if rp else None)


class RankingSettingsIn(BaseModel):
    label: str | None = None
    custom_weights: dict[str, float] | None = None

    @field_validator("custom_weights")
    @classmethod
    def _range(cls, w):
        if w and any(v < 0 or v > 5 for v in w.values()):
            raise ValueError("weights must be between 0 and 5")
        return w


@router.put("/jobs/{job_id}/ranking-settings", response_model=RankingOut, operation_id="jobs_ranking_settings_put")
async def ranking_settings(job_id: uuid.UUID, body: RankingSettingsIn, ctx: Ctx = Depends(tenant_ctx)):
    """Choose a label (any role) or set custom per-job weights (admins), MAT-04 and MAT-05. Choosing a label clears custom weights."""
    if body.custom_weights is not None and ctx.membership.role == "scheduler":
        raise AppError(403, "forbidden", "Only admins can tune weights")
    job = await ctx.session.get(Job, job_id)
    if not job:
        raise not_found("Job")
    jr = (await ctx.session.execute(select(JobRanking).where(JobRanking.job_id == job_id))).scalar_one_or_none()
    if not jr:
        jr = JobRanking(tenant_id=ctx.tenant_id, job_id=job_id)
        ctx.session.add(jr)
    if body.label is not None:
        lab = (await ctx.session.execute(select(RankingLabel).where(RankingLabel.name == body.label))).scalar_one_or_none()
        if not lab:
            raise not_found("Label")
        jr.label_id, jr.custom_weights = lab.id, None
    if body.custom_weights is not None:
        jr.custom_weights = body.custom_weights or None
    await ctx.session.flush()
    await record(ctx, "Edit", f"Ranking for {job.title}: {'label ' + body.label if body.label else 'custom weights'}.", entity_type="job",
                 entity_id=job.id, job_id=job.id)
    return await ranking(job_id, None, ctx)


# ---------- queue (Q-01, Q-03) ----------

class QueueItem(BaseModel):
    job_id: uuid.UUID
    title: str
    area: str
    price: float
    painter_days: float
    earliest_start: date
    finish_by: date
    important: list[str]
    colors_status: str | None
    placement_status: str | None
    top_crew_id: uuid.UUID | None
    top_crew_name: str | None
    top_crew_start: date | None
    top_score: int | None
    passing_crews: int
    riley_pick: RileyPickOut | None


class Kpis(BaseModel):
    booked_pct: int
    booked_crew_days: int
    capacity_crew_days: int
    jobs_on_calendar: int
    value_on_calendar: float
    waiting_jobs: int
    waiting_painter_days: int
    waiting_value: float
    open_crew_days: float
    open_day_value: float


class QueueOut(BaseModel):
    today: date
    items: list[QueueItem]
    kpis: Kpis


def _kpis(L: LoadedSnapshot) -> Kpis:
    k, w = kpi_sched(L.snap), kpi_waiting(L.snap)
    od = open_days(L.snap)
    return Kpis(booked_pct=k["pct"], booked_crew_days=k["pd"], capacity_crew_days=k["cap"], jobs_on_calendar=k["jobs"],
                value_on_calendar=k["val"], waiting_jobs=w["n"], waiting_painter_days=w["pd"], waiting_value=w["val"],
                open_crew_days=od, open_day_value=od * float(L.rules.open_day_value))


@router.get("/queue", response_model=QueueOut, operation_id="queue_get")
async def queue(ctx: Ctx = Depends(tenant_ctx)):
    L = await load_snapshot(ctx)
    snap = L.snap
    colors = {p.job_id: p.colors_status for p in (await ctx.session.execute(select(PaintingJob))).scalars()}
    items = []
    for jid in snap.queue:
        job = snap.jobs[jid]
        rows = rank(snap, jid)
        top = next((r for r in rows if r.ok), None)
        p = snap.place.get(jid)
        rp = riley_pick(snap, jid, rows)
        items.append(QueueItem(
            job_id=uuid.UUID(jid), title=job.title, area=L.area_names.get(job.area, ""), price=job.value, painter_days=painter_days(job),
            earliest_start=L.date(job.earliest), finish_by=L.date(job.deadline), important=imp_why(snap, job),
            colors_status=colors.get(uuid.UUID(jid)), placement_status=p.status if p else None,
            top_crew_id=uuid.UUID(top.crew) if top else None, top_crew_name=L.crew_names[top.crew] if top else None,
            top_crew_start=L.date(top.slot.s) if top else None, top_score=top.score if top else None,
            passing_crews=sum(1 for r in rows if r.ok),
            riley_pick=RileyPickOut(crew_id=uuid.UUID(rp["crew"]), crew_name=L.crew_names[rp["crew"]], why=rp["why"], pattern=rp["pattern"]) if rp else None))
    return QueueOut(today=L.anchor, items=items, kpis=_kpis(L))


@router.get("/kpis", response_model=Kpis, operation_id="kpis_get")
async def kpis(ctx: Ctx = Depends(tenant_ctx)):
    return _kpis(await load_snapshot(ctx))


# ---------- job detail / work order (MAT-01) ----------

class ColorOut(BaseModel):
    surface: str | None
    name: str
    hex: str | None


class JobOut(BaseModel):
    id: uuid.UUID
    title: str
    client_id: uuid.UUID | None
    job_type: str
    area: str
    sold_hours: float
    painter_days: float
    price: float | None
    earliest_start: date
    finish_by: date
    language: str
    queue_position: int | None
    write_up: str | None
    source_note: str | None
    important: list[str]
    year_built: int | None
    exterior: bool | None
    hoa: bool | None
    colors_status: str | None
    colors: list[ColorOut]
    version: int


@router.get("/jobs/{job_id}", response_model=JobOut, operation_id="jobs_get")
async def get_job(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    j = await ctx.session.get(Job, job_id)
    if not j:
        raise not_found("Job")
    L = await load_snapshot(ctx)
    ej = L.snap.jobs.get(str(job_id))
    p = (await ctx.session.execute(select(PaintingJob).where(PaintingJob.job_id == job_id))).scalar_one_or_none()
    cols = (await ctx.session.execute(select(PaintingColor).where(PaintingColor.job_id == job_id).order_by(PaintingColor.sort_order))).scalars()
    from app.settings.models import RatingDimension
    from app.geo.models import ServiceArea
    dim = await ctx.session.get(RatingDimension, j.job_type_id)
    area = await ctx.session.get(ServiceArea, j.service_area_id)
    return JobOut(id=j.id, title=j.title, client_id=j.client_id, job_type=dim.key, area=area.name, sold_hours=float(j.sold_hours),
                  painter_days=round(float(j.sold_hours) / 8, 1), price=float(j.price) if j.price is not None else None,
                  earliest_start=j.earliest_start, finish_by=j.finish_by, language=j.language, queue_position=j.queue_position,
                  write_up=j.write_up, source_note=j.source_note, important=imp_why(L.snap, ej) if ej else [],
                  year_built=p.year_built if p else None, exterior=p.is_exterior if p else None, hoa=p.hoa if p else None,
                  colors_status=p.colors_status if p else None,
                  colors=[ColorOut(surface=c.surface, name=c.color_name, hex=c.hex) for c in cols], version=j.version)
