"""Optimizer runs: run, rerun with feedback, apply (OPT-01 to OPT-10). The engine is pure; this module persists and applies."""
from __future__ import annotations

import copy
import uuid
from datetime import date

from sqlalchemy import func, select

from app.audit.service import record
from app.core.context import Ctx
from app.core.errors import AppError, not_found
from app.jobs.models import Job
from app.messaging.models import MessageBatch
from app.messaging.service import create_batch, fixed_messages
from app.scheduling.engine import model as m
from app.scheduling.models import Placement, PlacementVisit, SchedulingDecision
from app.scheduling.plan_service import check_fresh, fingerprint
from app.scheduling.service import _lock_crews, _save
from app.scheduling.snapshot import LoadedSnapshot, load_snapshot

from .engine import optimize
from .models import OptimizerMove, OptimizerRun

RANGES = {"1w": (0, 6), "2w": (0, 13), "4w": (0, 27)}
REJECT_REASONS = {"crew": "Wrong crew for this job", "dates": "Client needs other dates", "busy": "Crew isn’t available then",
                  "nomove": "Don’t move that confirmed job"}


def _window(L: LoadedSnapshot, range_: str | None, frm: date | None, to: date | None) -> tuple[int, int]:
    if frm and to:
        a, b = sorted((L.index(frm), L.index(to)))
    else:
        a, b = RANGES.get(range_ or "2w", RANGES["2w"])
    if a < 0 or b > L.snap.slot_horizon:
        raise AppError(422, "validation_failed", f"The window must be within the next {L.snap.slot_horizon + 1} days")
    return a, b


def _feedback(L: LoadedSnapshot, c: dict) -> m.OptimizerFeedback:
    blocks = [{**({"jid": b["job_id"]} if b.get("job_id") else {"crew": b["crew_id"]}), "s": L.index(date.fromisoformat(b["start"])),
               "e": L.index(date.fromisoformat(b["end"]))} for b in c.get("block", [])]
    return m.OptimizerFeedback(reject={k: list(v) for k, v in c.get("reject", {}).items()}, no_move=dict(c.get("no_move", {})), block=blocks)


async def run(ctx: Ctx, *, range_: str | None = None, frm: date | None = None, to: date | None = None, lock_days: int | None = None,
              include_all_crews: bool = False, weigh_margin: bool = False, riley: bool = False,
              parent: OptimizerRun | None = None, constraints: dict | None = None, kept: list[OptimizerMove] | None = None) -> OptimizerRun:
    L = await load_snapshot(ctx)
    snap = L.snap
    if parent:
        snap.win = (L.index(parent.window_from), L.index(parent.window_to))
        lock_days, include_all_crews, weigh_margin, riley = parent.lock_days, parent.include_all_crews, parent.weigh_margin, parent.riley
    else:
        snap.win = _window(L, range_, frm, to)
    snap.lock = lock_days or L.rules.lock_days
    if not 3 <= snap.lock <= 7:
        raise AppError(422, "validation_failed", "The no-move window is 3 to 7 days")
    snap.opt_all, snap.opt_margin = include_all_crews, weigh_margin
    constraints = constraints or {"reject": {}, "no_move": {}, "block": []}
    snap.ofb = _feedback(L, constraints)
    keep = None
    if parent:
        keep = {"before": parent.open_days_before, "kept": [
            {"jid": str(k.job_id), "crew": str(k.crew_id), "s": L.index(k.start_date), "e": L.index(k.end_date), "half": k.half_day,
             "score": k.score, "fit": k.fit, "v": k.value, "mg": k.margin_pct, "notReady": k.not_ready_crew, "top": str(k.top_crew_id) if k.top_crew_id else None,
             "topScore": k.top_score, "alts": [], "fill": k.fill,
             "shift": {"id": k.shift["placement_id"], "k": k.shift["days"], "name": k.shift["name"], "from": L.index(date.fromisoformat(k.shift["from"]))} if k.shift else None}
            for k in kept or []]}
    res = optimize(snap, keep)
    n = (await ctx.session.execute(select(func.max(OptimizerRun.run_no)))).scalar() or 0
    r = OptimizerRun(tenant_id=ctx.tenant_id, run_no=n + 1, parent_run_id=parent.id if parent else None, window_from=L.date(snap.win[0]),
                     window_to=L.date(snap.win[1]), lock_days=snap.lock, include_all_crews=include_all_crews, weigh_margin=weigh_margin, riley=riley,
                     open_days_before=res.before, open_days_after=res.after, skipped=res.skipped, constraints=constraints,
                     fingerprint=await fingerprint(ctx), created_by=ctx.membership.id)
    ctx.session.add(r)
    await ctx.session.flush()
    for i, mv in enumerate(res.moves):
        ctx.session.add(OptimizerMove(
            tenant_id=ctx.tenant_id, run_id=r.id, seq=i, job_id=uuid.UUID(mv["jid"]), crew_id=uuid.UUID(mv["crew"]), start_date=L.date(mv["s"]),
            end_date=L.date(mv["e"]), half_day=mv.get("half"), score=mv["score"], value=mv["v"], fit=mv["fit"], margin_pct=mv.get("mg"),
            not_ready_crew=bool(mv.get("notReady")), kept_from_parent=bool(mv.get("kept")), top_crew_id=uuid.UUID(mv["top"]) if mv.get("top") else None,
            top_score=mv.get("topScore"),
            shift={"placement_id": mv["shift"]["id"], "days": mv["shift"]["k"], "name": mv["shift"]["name"],
                   "from": L.date(mv["shift"]["from"]).isoformat()} if mv.get("shift") else None,
            alternatives=[{"crew_id": a["crew"], "start": L.date(a["s"]).isoformat(), "end": L.date(a["e"]).isoformat(), "score": a["score"],
                           "why": a["why"]} for a in mv.get("alts") or []],
            fill=mv.get("fill")))
    await ctx.session.flush()
    return r


async def moves_of(ctx: Ctx, run_id: uuid.UUID) -> list[OptimizerMove]:
    return (await ctx.session.execute(select(OptimizerMove).where(OptimizerMove.run_id == run_id).order_by(OptimizerMove.seq))).scalars().all()


async def get_run(ctx: Ctx, run_id: uuid.UUID) -> OptimizerRun:
    r = await ctx.session.get(OptimizerRun, run_id)
    if not r:
        raise not_found("Optimizer run")
    return r


async def rerun(ctx: Ctx, parent: OptimizerRun, feedback: list[dict]) -> OptimizerRun:
    """Rejected moves become constraints (prototype reopt); kept moves stay fixed; then run again."""
    if parent.status != "proposed":
        raise AppError(409, "plan_closed", "This run was already applied or replaced")
    moves = await moves_of(ctx, parent.id)
    by_seq = {mv.seq: mv for mv in moves}
    fb = {f["seq"]: f for f in feedback}
    c = copy.deepcopy(parent.constraints)
    kept, rejected = [], []
    for mv in moves:
        f = fb.get(mv.seq)
        if not f or f.get("keep", True):
            kept.append(mv)
            continue
        k = f.get("reason_key")
        if k not in REJECT_REASONS or (k == "nomove" and not mv.shift):
            raise AppError(422, "validation_failed", "Pick why this move is wrong", reasons=REJECT_REASONS)
        mv.selection, mv.reject_key, mv.reject_label = "reject", k, REJECT_REASONS[k]
        rejected.append(mv)
        if k == "crew":
            c["reject"].setdefault(str(mv.job_id), []).append(str(mv.crew_id))
        elif k == "nomove":
            c["no_move"][mv.shift["placement_id"]] = True
        elif k == "dates":
            c["block"].append({"job_id": str(mv.job_id), "start": mv.start_date.isoformat(), "end": mv.end_date.isoformat()})
        elif k == "busy":
            c["block"].append({"crew_id": str(mv.crew_id), "start": mv.start_date.isoformat(), "end": mv.end_date.isoformat()})
    if not rejected:
        raise AppError(422, "validation_failed", "Reject at least one move to run again")
    unknown = set(fb) - set(by_seq)
    if unknown:
        raise not_found("Move")
    titles = {j.id: j.title for j in (await ctx.session.execute(select(Job).where(Job.id.in_([mv.job_id for mv in rejected])))).scalars()}
    await record(ctx, "Optimizer", f"Rejected {len(rejected)} move{'' if len(rejected) == 1 else 's'} in run {parent.run_no}: "
                                   + "; ".join(f"{titles[mv.job_id]} ({mv.reject_label})" for mv in rejected) + ". Re-optimizing.")
    parent.status = "superseded"
    return await run(ctx, parent=parent, constraints=c, kept=kept)


async def apply(ctx: Ctx, r: OptimizerRun, keep_seqs: list[int] | None) -> tuple[list[Placement], MessageBatch | None]:
    """Kept moves become drafts marked 'Optimizer recommended'; confirmed jobs it shifted move with a decision and a message."""
    if r.status != "proposed":
        raise AppError(409, "plan_closed", "This run was already applied or replaced")
    moves = await moves_of(ctx, r.id)
    items = [mv for mv in moves if mv.selection == "keep" and (keep_seqs is None or mv.seq in keep_seqs)]
    await _lock_crews(ctx, [mv.crew_id for mv in items])
    await check_fresh(ctx, r.fingerprint)
    L = await load_snapshot(ctx)
    msgs = []
    placed = []
    shifted = 0
    for mv in items:
        if mv.shift:
            fixed = await ctx.session.get(Placement, uuid.UUID(mv.shift["placement_id"]))
            visits = (await ctx.session.execute(select(PlacementVisit).where(PlacementVisit.placement_id == fixed.id))).scalars().all()
            from datetime import timedelta
            before = [{"start": v.start_date.isoformat(), "end": v.end_date.isoformat()} for v in visits]
            for v in visits:
                v.start_date += timedelta(days=mv.shift["days"])
                v.end_date += timedelta(days=mv.shift["days"])
            fixed.version += 1
            fjob = await ctx.session.get(Job, fixed.job_id)
            fb = next(b for b in L.snap.fixed if b.id == str(fixed.id))
            dec = SchedulingDecision(tenant_id=ctx.tenant_id, job_id=fjob.id, placement_id=fixed.id, kind="optimizer_apply", actor_kind="optimizer",
                                     actor_id=ctx.membership.id, actor_label=ctx.actor_label, crew_ids=[fb.crew],
                                     visits=[{"start": v.start_date.isoformat(), "end": v.end_date.isoformat()} for v in visits],
                                     before={"visits": before}, reason_code=f"Optimizer run {r.run_no}: made room for another job")
            ctx.session.add(dec)
            shifted += 1
            msgs += await fixed_messages(ctx, L.snap, fb.crew, fb.name, fb.what, fb.s + mv.shift["days"], fb.e + mv.shift["days"], "move")
        row = (await ctx.session.execute(select(Placement).where(Placement.job_id == mv.job_id))).scalar_one_or_none()
        if row and row.status == "scheduled":
            continue
        if not row:
            row = Placement(tenant_id=ctx.tenant_id, job_id=mv.job_id, status="draft")
            ctx.session.add(row)
            await ctx.session.flush()
        else:
            row.version += 1
        row.source, row.recommended_by, row.recommended_crew_id, row.override_reason = "optimizer", "optimizer", mv.crew_id, None
        ep = m.Placement(crew=str(mv.crew_id), segs=[[L.index(mv.start_date), L.index(mv.end_date)]], status="draft", half=mv.half_day)
        await _save(ctx, L, row, ep)
        placed.append(row)
    r.status = "applied"
    for mv in moves:
        if mv not in items and mv.selection == "keep":
            mv.selection, mv.reject_key, mv.reject_label = "reject", "not_applied", "Left out when applying"
    await record(ctx, "Optimizer", f"Optimizer run {r.run_no}: placed {len(placed)} job{'' if len(placed) == 1 else 's'} as drafts"
                                   f"{f', moved {shifted} confirmed job' + ('' if shifted == 1 else 's') if shifted else ''}. "
                                   f"Open crew days {r.open_days_before:g} → {r.open_days_after:g}. Approved by {ctx.actor_label}.",
                 entity_type="optimizer_run", entity_id=r.id)
    batch = await create_batch(ctx, trigger="move", title="Confirmed jobs the optimizer moved", job=None, msgs=msgs) if msgs else None
    return placed, batch
