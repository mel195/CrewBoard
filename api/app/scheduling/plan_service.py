"""Plan all (Q-07, CAL-09, CAL-10) and the schedule fingerprint used to detect stale plans (DD-12)."""
from __future__ import annotations

import uuid

from sqlalchemy import select

from app.assistant.engine import riley_pick
from app.audit.service import record
from app.core.context import Ctx
from app.core.errors import AppError, not_found
from app.jobs.models import Job
from app.messaging.service import create_batch, job_messages

from .engine import core as E
from .engine.planning import plan_all as engine_plan_all
from .engine.ranking import rank
from .models import Placement, PlanAllRun, SchedulingDecision
from .service import _lock_crews, _riley_learn, _save, _snapshot_rows, _visits
from .snapshot import load_snapshot


async def fingerprint(ctx: Ctx) -> dict:
    """Every placement's version. Any change (edit, new, removed) makes a computed plan stale."""
    return {str(p.id): p.version for p in (await ctx.session.execute(select(Placement))).scalars()}


async def check_fresh(ctx: Ctx, fp: dict) -> None:
    now = await fingerprint(ctx)
    if now != fp:
        changed = sorted({k for k in set(now) | set(fp) if now.get(k) != fp.get(k)})
        raise AppError(409, "plan_stale", "The schedule changed after this plan was made. Run it again.", changed=changed)


async def plan_all(ctx: Ctx) -> PlanAllRun:
    """Clear unconfirmed drafts in the queue, then place each waiting job on its top passing crew at its earliest slot."""
    L = await load_snapshot(ctx)
    snap = L.snap.copy()
    res = engine_plan_all(snap)
    rows = {str(p.job_id): p for p in (await ctx.session.execute(select(Placement))).scalars()}
    for jid in L.snap.queue:
        p = rows.get(jid)
        if p and p.status != "scheduled":
            await ctx.session.delete(p)
    await ctx.session.flush()
    items = []
    for it in res.items:
        jid = it["jid"]
        row = Placement(tenant_id=ctx.tenant_id, job_id=uuid.UUID(jid), status="draft", source="plan_all")
        ctx.session.add(row)
        await ctx.session.flush()
        await _save(ctx, L, row, snap.place[jid])
        items.append({"job_id": jid, "crew_id": it["crew"], "start": L.date(it["s"]).isoformat(), "end": L.date(it["e"]).isoformat(),
                      "score": it["score"], "placement_id": str(row.id)})
    run = PlanAllRun(tenant_id=ctx.tenant_id, items=items, skipped=res.skipped, fingerprint=await fingerprint(ctx), created_by=ctx.membership.id)
    ctx.session.add(run)
    await ctx.session.flush()
    return run


async def confirm_all(ctx: Ctx, run_id: uuid.UUID, send_messages: bool) -> tuple[PlanAllRun, list]:
    """Confirm every planned job. No messages unless asked (prototype sends none; PD-01)."""
    run = await ctx.session.get(PlanAllRun, run_id)
    if not run:
        raise not_found("Plan")
    if run.status != "proposed":
        raise AppError(409, "plan_closed", "This plan was already confirmed or discarded")
    await _lock_crews(ctx, [it["crew_id"] for it in run.items])
    await check_fresh(ctx, run.fingerprint)
    L = await load_snapshot(ctx)
    batches = []
    for it in run.items:
        jid = it["job_id"]
        row = await ctx.session.get(Placement, uuid.UUID(it["placement_id"]))
        job = await ctx.session.get(Job, uuid.UUID(jid))
        ep = L.snap.place[jid]
        rows = rank(L.snap, jid)
        rp = riley_pick(L.snap, jid, rows)
        row.status = "scheduled"
        row.version += 1
        crews = E.crews_of(ep.crew, ep.extra)
        dec = SchedulingDecision(tenant_id=ctx.tenant_id, job_id=job.id, placement_id=row.id, kind="plan_all_confirm", actor_kind="person",
                                 actor_id=ctx.membership.id, actor_label=ctx.actor_label, crew_ids=crews, visits=_visits(L, ep),
                                 top_crew_id=uuid.UUID(it["crew_id"]), top_score=it["score"], chosen_score=it["score"],
                                 score_snapshot=_snapshot_rows(L, rows))
        ctx.session.add(dec)
        await ctx.session.flush()
        await record(ctx, "Decision", f"Confirmed {L.crew_names[ep.crew]} for {job.title} through Plan all. Top available crew, match {it['score']}.",
                     entity_type="scheduling_decision", entity_id=dec.id, job_id=job.id)
        await _riley_learn(ctx, L, jid, job, dec, ep.crew, rp, None)
        if send_messages:
            msgs = await job_messages(ctx, L.snap, job, crews, E.place_start(ep), E.place_end(ep), "confirm", row.pm_id)
            b = await create_batch(ctx, trigger="confirm", title=f"{job.title} is confirmed", job=job, msgs=msgs, decision_id=dec.id)
            if b:
                batches.append(b)
    run.status = "confirmed"
    return run, batches
