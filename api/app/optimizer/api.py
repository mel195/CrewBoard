"""Plan all and optimizer endpoints (Q-07, CAL-09, CAL-10, OPT-01 to OPT-10)."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core import idempotency
from app.core.context import Ctx, tenant_ctx
from app.crews.models import Crew
from app.jobs.models import Job
from app.messaging.api import BatchOut, batch_out
from app.scheduling import plan_service
from app.scheduling.models import PlanAllRun

from . import service as svc
from .models import OptimizerRun

router = APIRouter(tags=["optimizer"])


async def _names(ctx: Ctx):
    crews = {str(c.id): c.name for c in (await ctx.session.execute(select(Crew))).scalars()}
    jobs = {str(j.id): j.title for j in (await ctx.session.execute(select(Job))).scalars()}
    return crews, jobs


# ---------- Plan all ----------

class PlanItem(BaseModel):
    job_id: uuid.UUID
    job_title: str
    crew_id: uuid.UUID
    crew_name: str
    start: date
    end: date
    score: int
    placement_id: uuid.UUID


class PlanAllOut(BaseModel):
    id: uuid.UUID
    status: str
    items: list[PlanItem]
    skipped: list[dict]


async def plan_out(ctx: Ctx, run: PlanAllRun) -> PlanAllOut:
    crews, jobs = await _names(ctx)
    return PlanAllOut(id=run.id, status=run.status,
                      items=[PlanItem(**{**it, "job_title": jobs[it["job_id"]], "crew_name": crews[it["crew_id"]]}) for it in run.items],
                      skipped=[{"job_id": j, "job_title": jobs.get(j)} for j in run.skipped])


@router.post("/plan-all", response_model=PlanAllOut, status_code=201, operation_id="plan_all_create")
async def plan_all(ctx: Ctx = Depends(tenant_ctx)):
    """Clear unconfirmed drafts and place every waiting job on its top passing crew (drafts). Review on the calendar or confirm all."""
    return await plan_out(ctx, await plan_service.plan_all(ctx))


class ConfirmAllIn(BaseModel):
    send_messages: bool = False   # PD-01: the prototype sends none


class ConfirmAllOut(PlanAllOut):
    message_batches: list[BatchOut] = []


@router.post("/plan-all/{run_id}/confirm", response_model=ConfirmAllOut, operation_id="plan_all_confirm")
async def confirm_all(run_id: uuid.UUID, body: ConfirmAllIn, request: Request, idempotency_key: str | None = Header(None),
                      ctx: Ctx = Depends(tenant_ctx)):
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, body.model_dump())
    if prev is not None:
        return prev
    run, batches = await plan_service.confirm_all(ctx, run_id, body.send_messages)
    out = ConfirmAllOut(**(await plan_out(ctx, run)).model_dump(), message_batches=[await batch_out(ctx, b) for b in batches])
    data = out.model_dump(mode="json")
    await idempotency.store(ctx, idempotency_key, request.url.path, body.model_dump(), data)
    return data


# ---------- optimizer ----------

class AltOut(BaseModel):
    crew_id: uuid.UUID
    crew_name: str
    start: date
    end: date
    score: int
    why: str


class ShiftOut(BaseModel):
    placement_id: uuid.UUID
    name: str
    days: int
    original_start: date


class MoveOut(BaseModel):
    seq: int
    job_id: uuid.UUID
    job_title: str
    crew_id: uuid.UUID
    crew_name: str
    start: date
    end: date
    half_day: str | None
    score: int
    fit: int
    margin_pct: int | None
    not_ready_crew: bool
    kept_from_previous_run: bool
    top_crew_id: uuid.UUID | None
    top_score: int | None
    shift: ShiftOut | None
    alternatives: list[AltOut]
    open_days_filled: float | None
    selection: str
    reject_reason: str | None


class RunOut(BaseModel):
    id: uuid.UUID
    run_no: int
    status: str
    window_from: date
    window_to: date
    lock_days: int
    include_all_crews: bool
    weigh_margin: bool
    riley: bool
    open_days_before: float
    open_days_after: float
    skipped: list[dict]
    constraints: dict
    moves: list[MoveOut]


async def run_out(ctx: Ctx, r: OptimizerRun) -> RunOut:
    crews, jobs = await _names(ctx)
    moves = await svc.moves_of(ctx, r.id)
    return RunOut(
        id=r.id, run_no=r.run_no, status=r.status, window_from=r.window_from, window_to=r.window_to, lock_days=r.lock_days,
        include_all_crews=r.include_all_crews, weigh_margin=r.weigh_margin, riley=r.riley, open_days_before=r.open_days_before,
        open_days_after=r.open_days_after, skipped=[{"job_id": j, "job_title": jobs.get(j)} for j in r.skipped], constraints=r.constraints,
        moves=[MoveOut(seq=mv.seq, job_id=mv.job_id, job_title=jobs[str(mv.job_id)], crew_id=mv.crew_id, crew_name=crews[str(mv.crew_id)],
                       start=mv.start_date, end=mv.end_date, half_day=mv.half_day, score=mv.score, fit=mv.fit, margin_pct=mv.margin_pct,
                       not_ready_crew=mv.not_ready_crew, kept_from_previous_run=mv.kept_from_parent, top_crew_id=mv.top_crew_id, top_score=mv.top_score,
                       shift=ShiftOut(placement_id=mv.shift["placement_id"], name=mv.shift["name"], days=mv.shift["days"],
                                      original_start=mv.shift["from"]) if mv.shift else None,
                       alternatives=[AltOut(**a, crew_name=crews[a["crew_id"]]) for a in mv.alternatives], open_days_filled=mv.fill,
                       selection=mv.selection, reject_reason=mv.reject_label) for mv in moves])


class RunIn(BaseModel):
    range: str | None = Field(None, pattern="^(1w|2w|4w)$")
    window_from: date | None = None
    window_to: date | None = None
    lock_days: int | None = Field(None, ge=3, le=7)
    include_all_crews: bool = False
    weigh_margin: bool = False
    riley: bool = False


@router.post("/optimizer-runs", response_model=RunOut, status_code=201, operation_id="optimizer_runs_create")
async def create_run(body: RunIn, ctx: Ctx = Depends(tenant_ctx)):
    """Suggest a better plan for unconfirmed jobs in a window; may push a confirmed job 1 or 2 days outside the no-move window."""
    r = await svc.run(ctx, range_=body.range, frm=body.window_from, to=body.window_to, lock_days=body.lock_days,
                      include_all_crews=body.include_all_crews, weigh_margin=body.weigh_margin, riley=body.riley)
    return await run_out(ctx, r)


@router.get("/optimizer-runs/{run_id}", response_model=RunOut, operation_id="optimizer_runs_get")
async def get_run(run_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    return await run_out(ctx, await svc.get_run(ctx, run_id))


@router.get("/optimizer-runs/{run_id}/csv", response_class=PlainTextResponse, operation_id="optimizer_runs_csv")
async def run_csv(run_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    out = await run_out(ctx, await svc.get_run(ctx, run_id))
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Job", "Crew", "Start", "End", "Match", "Margin %", "Moves confirmed job", "Open days filled", "Decision"])
    for mv in out.moves:
        w.writerow([mv.job_title, mv.crew_name, mv.start, mv.end, mv.score, mv.margin_pct if mv.margin_pct is not None else "",
                    f"{mv.shift.name} +{mv.shift.days}d" if mv.shift else "", mv.open_days_filled, mv.selection])
    return PlainTextResponse(buf.getvalue(), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="crewboard-optimizer-run-{out.run_no}.csv"'})


class Feedback(BaseModel):
    seq: int
    keep: bool
    reason_key: str | None = Field(None, pattern="^(crew|dates|busy|nomove)$")


class RerunIn(BaseModel):
    moves: list[Feedback]


@router.post("/optimizer-runs/{run_id}/rerun", response_model=RunOut, status_code=201, operation_id="optimizer_runs_rerun")
async def rerun(run_id: uuid.UUID, body: RerunIn, ctx: Ctx = Depends(tenant_ctx)):
    """Rejected moves become rules for the next run; kept moves stay as they are (OPT-06, OPT-07)."""
    r = await svc.rerun(ctx, await svc.get_run(ctx, run_id), [f.model_dump() for f in body.moves])
    return await run_out(ctx, r)


class ApplyIn(BaseModel):
    keep: list[int] | None = None   # move seqs to apply; default all kept moves


class ApplyOut(BaseModel):
    run: RunOut
    placement_ids: list[uuid.UUID]
    message_batch: BatchOut | None


@router.post("/optimizer-runs/{run_id}/apply", response_model=ApplyOut, operation_id="optimizer_runs_apply")
async def apply(run_id: uuid.UUID, body: ApplyIn, request: Request, idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    """Kept moves become drafts marked 'Optimizer recommended'. Fails with plan_stale if the schedule changed since the run (OPT-08)."""
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, body.model_dump())
    if prev is not None:
        return prev
    r = await svc.get_run(ctx, run_id)
    placed, batch = await svc.apply(ctx, r, body.keep)
    out = ApplyOut(run=await run_out(ctx, r), placement_ids=[p.id for p in placed], message_batch=await batch_out(ctx, batch)).model_dump(mode="json")
    await idempotency.store(ctx, idempotency_key, request.url.path, body.model_dump(), out)
    return out
