"""Placement endpoints (build step 3): place, edit/drag, split, resize, confirm, move, unschedule, clear, calendar, decisions."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Header, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core import idempotency
from app.core.context import Ctx, tenant_ctx
from app.core.errors import AppError, not_found
from app.messaging.api import BatchOut, batch_out
from app.messaging.builders import Msg

from . import service as svc
from .engine import core as E
from .engine.ranking import hard
from .models import Placement, SchedulingDecision
from .snapshot import LoadedSnapshot, load_snapshot

router = APIRouter(tags=["placements"])


class VisitOut(BaseModel):
    seq: int
    start: date
    end: date


class DayPlanOut(BaseModel):
    date: date
    kind: str            # work | rain | pause
    n: int | None = None


class PlacementOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    lead_crew_id: uuid.UUID
    extra_crew_ids: list[uuid.UUID]
    visits: list[VisitOut]
    half_day: str | None
    pm_id: uuid.UUID | None
    recommended_by: str | None
    override_reason: str | None
    days: list[DayPlanOut]
    conflicts: list[date]
    warnings: list[str]
    version: int


class DecisionOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    kind: str
    actor: str
    crew_ids: list[uuid.UUID]
    visits: list[dict]
    before: dict | None
    reason: str | None
    top_crew_id: uuid.UUID | None
    top_score: int | None
    chosen_score: int | None
    conflicts: list[date]
    created_at: datetime
    score_snapshot: list[dict] | None = None


class ActionOut(BaseModel):
    placement: PlacementOut | None
    decision: DecisionOut | None = None
    riley_agreed: bool | None = None
    message_batch: BatchOut | None = None
    warnings: list[str] = []


def decision_out(d: SchedulingDecision, detail: bool = False) -> DecisionOut:
    return DecisionOut(id=d.id, job_id=d.job_id, kind=d.kind, actor=d.actor_label, crew_ids=[uuid.UUID(c) for c in d.crew_ids], visits=d.visits,
                       before=d.before, reason=d.reason_code, top_crew_id=d.top_crew_id, top_score=d.top_score, chosen_score=d.chosen_score,
                       conflicts=d.conflicts, created_at=d.created_at, score_snapshot=d.score_snapshot if detail else None)


async def placement_out(ctx: Ctx, row: Placement, L: LoadedSnapshot | None = None, warnings: list[str] | None = None) -> PlacementOut:
    L = L or await load_snapshot(ctx)
    jid = str(row.job_id)
    ep = L.snap.place[jid]
    job = L.snap.jobs[jid]
    if warnings is None:
        warnings = [f.message for f in hard(L.snap, job, ep.crew)]
        if E.place_end(ep) > job.deadline:
            warnings.append(f"Finishes after the finish-by date")
    return PlacementOut(
        id=row.id, job_id=row.job_id, status=row.status, lead_crew_id=uuid.UUID(ep.crew), extra_crew_ids=[uuid.UUID(x) for x in ep.extra],
        visits=[VisitOut(seq=i, start=L.date(a), end=L.date(z)) for i, (a, z) in enumerate(ep.segs, start=1)], half_day=row.half_day,
        pm_id=row.pm_id, recommended_by=row.recommended_by, override_reason=row.override_reason,
        days=[DayPlanOut(date=L.date(x["d"]), kind=x["k"], n=x.get("n")) for x in E.place_days(L.snap, jid)],
        conflicts=[L.date(d) for d in E.place_conf(L.snap, jid)], warnings=warnings, version=row.version)


async def action_out(ctx: Ctx, r: svc.Result) -> ActionOut:
    await ctx.session.flush()
    p = None
    if r.placement is not None:
        await ctx.session.refresh(r.placement)
        p = await placement_out(ctx, r.placement)
    return ActionOut(placement=p, decision=decision_out(r.decision) if r.decision else None, riley_agreed=r.riley_agreed,
                     message_batch=await batch_out(ctx, r.batch) if r.batch else None, warnings=r.warnings or [])


async def _idem(ctx: Ctx, request: Request, key: str | None, body, run):
    """Run an action once per Idempotency-Key; a repeat returns the stored response."""
    prev = await idempotency.lookup(ctx, key, request.url.path, body)
    if prev is not None:
        return prev
    out = (await run()).model_dump(mode="json")
    await idempotency.store(ctx, key, request.url.path, body, out)
    return out


# ---------- endpoints ----------

class PlaceIn(BaseModel):
    lead_crew_id: uuid.UUID | None = None
    start: date | None = None
    manual: bool = False
    reason_code: str | None = None
    reason_note: str | None = None


@router.post("/jobs/{job_id}/placement", response_model=PlacementOut, status_code=201, operation_id="placements_create")
async def place(job_id: uuid.UUID, body: PlaceIn, response: Response, ctx: Ctx = Depends(tenant_ctx)):
    """Place a draft. No crew = the top passing crew at its earliest slot (MAT-09). `manual` = Pick a crew yourself (needs a reason)."""
    r = await svc.place(ctx, job_id, body.lead_crew_id, body.start, body.manual, body.reason_code, body.reason_note)
    await ctx.session.flush()
    out = await placement_out(ctx, r.placement)
    response.headers["ETag"] = f'"{out.version}"'
    return out


@router.get("/placements/{placement_id}", response_model=PlacementOut, operation_id="placements_get")
async def get(placement_id: uuid.UUID, response: Response, ctx: Ctx = Depends(tenant_ctx)):
    row = await svc.get_placement(ctx, placement_id)
    response.headers["ETag"] = f'"{row.version}"'
    return await placement_out(ctx, row)


class EditIn(BaseModel):
    start: date | None = None
    lead_crew_id: uuid.UUID | None = None
    visit_seq: int | None = Field(None, ge=1, le=2)
    extra_crew_ids: list[uuid.UUID] | None = None
    half_day: str | None = Field(None, pattern="^(am|pm)$")
    pm_id: uuid.UUID | None = None


@router.patch("/placements/{placement_id}", response_model=PlacementOut, operation_id="placements_update")
async def edit(placement_id: uuid.UUID, body: EditIn, response: Response, if_match: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    """Edit a draft: drag to a day or crew (moves every visit, or just `visit_seq` of a split job), second crews, half day, PM."""
    r = await svc.edit(ctx, placement_id, if_match, start=body.start, lead_crew_id=body.lead_crew_id, visit_seq=body.visit_seq,
                       extra_crew_ids=body.extra_crew_ids, half_day=body.half_day, pm_id=body.pm_id, pm_set="pm_id" in body.model_fields_set)
    await ctx.session.flush()
    out = await placement_out(ctx, r.placement)
    response.headers["ETag"] = f'"{out.version}"'
    return out


@router.post("/placements/{placement_id}/split", response_model=PlacementOut, operation_id="placements_split")
async def split(placement_id: uuid.UUID, if_match: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    r = await svc.split(ctx, placement_id, if_match)
    await ctx.session.flush()
    return await placement_out(ctx, r.placement)


class ResizeIn(BaseModel):
    seq: int = Field(ge=1, le=2)
    end: date


@router.post("/placements/{placement_id}/resize", response_model=PlacementOut, operation_id="placements_resize")
async def resize(placement_id: uuid.UUID, body: ResizeIn, if_match: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    r = await svc.resize(ctx, placement_id, if_match, body.seq, body.end)
    await ctx.session.flush()
    return await placement_out(ctx, r.placement)


@router.delete("/placements/{placement_id}", status_code=204, operation_id="placements_clear")
async def clear(placement_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    await svc.clear(ctx, placement_id)


class MessagePreview(BaseModel):
    key: str
    role: str
    to: str
    channel: str
    language: str
    body: str


class ConfirmPreviewOut(BaseModel):
    reason_required: bool
    reasons: list[str]
    can_confirm: bool = True
    blockers: list[dict] = []
    top: dict | None
    chosen: dict
    conflicts: list[date]
    messages: list[MessagePreview]


@router.get("/placements/{placement_id}/confirm-preview", response_model=ConfirmPreviewOut, operation_id="placements_confirm_preview")
async def confirm_preview(placement_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    p = await svc.confirm_preview(ctx, placement_id)
    p["messages"] = [MessagePreview(key=m.key, role=m.role, to=m.to, channel=m.channel, language=m.lang, body=m.text) for m in p["messages"]]
    return ConfirmPreviewOut(**p)


class ReasonIn(BaseModel):
    reason_code: str | None = None
    reason_note: str | None = None


@router.post("/placements/{placement_id}/confirm", response_model=ActionOut, operation_id="placements_confirm")
async def confirm(placement_id: uuid.UUID, body: ReasonIn, request: Request, if_match: str | None = Header(None),
                  idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    async def run():
        return await action_out(ctx, await svc.confirm(ctx, placement_id, if_match, body.reason_code, body.reason_note))
    return await _idem(ctx, request, idempotency_key, body.model_dump(), run)


class MoveIn(BaseModel):
    start: date | None = None
    lead_crew_id: uuid.UUID | None = None
    visit_seq: int | None = Field(None, ge=1, le=2)
    reason_code: str | None = None
    reason_note: str | None = None


@router.post("/placements/{placement_id}/move", response_model=ActionOut, operation_id="placements_move")
async def move(placement_id: uuid.UUID, body: MoveIn, request: Request, if_match: str | None = Header(None),
               idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    async def run():
        return await action_out(ctx, await svc.move(ctx, placement_id, if_match, start=body.start, lead_crew_id=body.lead_crew_id,
                                                    visit_seq=body.visit_seq, reason_code=body.reason_code, reason_note=body.reason_note))
    return await _idem(ctx, request, idempotency_key, body.model_dump(mode="json"), run)


@router.post("/placements/{placement_id}/unschedule", response_model=ActionOut, operation_id="placements_unschedule")
async def unschedule(placement_id: uuid.UUID, request: Request, if_match: str | None = Header(None),
                     idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    async def run():
        return await action_out(ctx, await svc.unschedule(ctx, placement_id, if_match))
    return await _idem(ctx, request, idempotency_key, {}, run)


@router.post("/jobs/{job_id}/handoff", response_model=BatchOut, operation_id="jobs_handoff")
async def handoff(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    b = await svc.handoff(ctx, job_id)
    return await batch_out(ctx, b)


@router.get("/decisions/{decision_id}", response_model=DecisionOut, operation_id="decisions_get")
async def decision(decision_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    d = await ctx.session.get(SchedulingDecision, decision_id)
    if not d:
        raise not_found("Decision")
    return decision_out(d, detail=True)


@router.get("/jobs/{job_id}/decisions", response_model=list[DecisionOut], operation_id="jobs_decisions_list")
async def job_decisions(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    ds = (await ctx.session.execute(select(SchedulingDecision).where(SchedulingDecision.job_id == job_id)
                                    .order_by(SchedulingDecision.created_at.desc()))).scalars()
    return [decision_out(d) for d in ds]


# ---------- calendar (CAL-01 to CAL-04, CAL-06) ----------

class CalBooking(BaseModel):
    id: str
    crew_id: uuid.UUID
    job_id: uuid.UUID | None
    placement_id: uuid.UUID | None
    title: str
    start: date
    end: date
    half_day: str | None
    status: str          # confirmed | draft
    extra_crew: bool
    value: float


class CalCrew(BaseModel):
    id: uuid.UUID
    name: str
    region: str | None
    working: list[bool]


class CalendarOut(BaseModel):
    start: date
    days: list[date]
    rain: list[int]
    crews: list[CalCrew]
    bookings: list[CalBooking]
    unscheduled: list[uuid.UUID]


@router.get("/calendar", response_model=CalendarOut, operation_id="calendar_get")
async def calendar(days: int = 28, show: str = "all", region: str | None = None, ctx: Ctx = Depends(tenant_ctx)):
    """Crew rows with every booking (confirmed work, drafts, scheduled queue jobs), rain by day, and the unscheduled tray."""
    if days < 1 or days > 42:
        raise AppError(422, "validation_failed", "days must be 1 to 42")
    L = await load_snapshot(ctx)
    snap = L.snap
    pl = {str(p.job_id): p.id for p in (await ctx.session.execute(select(Placement))).scalars()}
    out = []
    for b in E.bookings(snap):
        status = "draft" if b.prop else "confirmed"
        if show == "drafts" and status != "draft" or show == "confirmed" and status != "confirmed":
            continue
        if b.s >= days:
            continue
        out.append(CalBooking(id=b.id, crew_id=uuid.UUID(b.crew), job_id=uuid.UUID(b.jid) if b.jid else None,
                              placement_id=pl.get(b.jid) if b.jid else uuid.UUID(b.id), title=b.name, start=L.date(b.s), end=L.date(b.e),
                              half_day=b.half, status=status, extra_crew=b.extra_crew, value=b.value))
    crews = [c for c in snap.active_crews() if not region or c.region == region]
    return CalendarOut(start=L.anchor, days=[L.date(i) for i in range(days)], rain=snap.rain_prob[:days],
                       crews=[CalCrew(id=uuid.UUID(c.id), name=c.name, region=c.region, working=[bool(E.day_cap(snap, c.id, d)) for d in range(days)])
                              for c in crews],
                       bookings=out, unscheduled=[uuid.UUID(j) for j in snap.queue if j not in snap.place])
