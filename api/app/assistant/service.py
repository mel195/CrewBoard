"""Riley: summary, stages and own bookings, habits, questions, learners, log, pick detail (RIL-01 to RIL-10, MAT-11, MAT-12)."""
from __future__ import annotations

import re
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select

from app.audit.service import record
from app.core.context import Ctx
from app.core.errors import AppError, not_found
from app.crews.models import Crew
from app.jobs.models import Job
from app.platform.models import Membership
from app.scheduling.engine import core as E
from app.scheduling.engine import model as m
from app.scheduling.engine.ranking import dlabel, rank
from app.scheduling.models import Placement, SchedulingDecision
from app.scheduling.service import _save, _visits
from app.scheduling.snapshot import load_snapshot
from app.settings.models import RatingDimension

from .engine import riley_pick
from .models import AssistantHabit, AssistantLearner, AssistantObservation, AssistantQuestion, AssistantState

STAGES = [("Training", "Watches and learns while your schedulers work as usual. Shows its pick, books nothing."),
          ("Suggesting", "Its pick shows first. A scheduler still confirms every job."),
          ("Booking small jobs", "Books jobs under the limit on its own. Every booking is logged and can be undone."),
          ("Booking with approval", "Plans the whole queue. A scheduler approves the plan.")]
CONDITION_KEYS = {"job_type", "min_value", "skills_any"}


async def state(ctx: Ctx) -> AssistantState:
    return (await ctx.session.execute(select(AssistantState))).scalar_one()


async def summary(ctx: Ctx) -> dict:
    st = await state(ctx)
    obs = (await ctx.session.execute(select(AssistantObservation).where(AssistantObservation.used_in_training))).scalars().all()
    observed = st.base_observed + len(obs)
    agreed = st.base_agreed + sum(1 for o in obs if o.agreed)
    by_type = {k: list(v) for k, v in (st.base_by_type or {}).items()}
    by_sched: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for o in obs:
        bt = by_type.setdefault(o.job_type, [0, 0])
        bt[0] += 1
        bt[1] += int(o.agreed)
        bs = by_sched[o.scheduler_label]
        bs[0] += 1
        bs[1] += int(o.agreed)
    L = await load_snapshot(ctx)
    picks = []
    for jid in L.snap.queue:
        rp = riley_pick(L.snap, jid)
        if rp:
            picks.append({"job_id": jid, "crew_id": rp["crew"], "crew_name": L.crew_names[rp["crew"]], "why": rp["why"], "pattern": rp["pattern"]})
    booked = (await ctx.session.execute(select(Placement).where(Placement.source == "riley", Placement.status == "scheduled"))).scalars().all()
    learners = {l.membership_id: l.enabled for l in (await ctx.session.execute(select(AssistantLearner))).scalars()}
    members = (await ctx.session.execute(select(Membership).where(Membership.tenant_id == ctx.tenant_id, Membership.status == "active"))).scalars().all()
    return {"stage": st.stage, "stage_name": STAGES[st.stage][0], "stage_description": STAGES[st.stage][1],
            "stages": [{"stage": i, "name": n, "description": d} for i, (n, d) in enumerate(STAGES)],
            "observed": observed, "agreed": agreed, "agreement_pct": round(agreed / observed * 100) if observed else 0,
            "by_job_type": {k: {"observed": v[0], "agreed": v[1]} for k, v in by_type.items()},
            "by_scheduler": {k: {"observed": v[0], "agreed": v[1]} for k, v in by_sched.items()},
            "picks": picks, "auto_booked": [str(p.job_id) for p in booked],
            "learners": [{"membership_id": str(mb.id), "name": mb.display_name, "enabled": learners.get(mb.id, True)} for mb in members],
            "last_refreshed_at": st.last_refreshed_at}


async def set_stage(ctx: Ctx, stage: int) -> dict:
    """Stage 2 (Booking small jobs) books every unplaced job under the limit on its own, with no messages (PD-01, PD-07).
    Leaving stage 2 removes those bookings (prototype rstage)."""
    st = await state(ctx)
    if stage == st.stage:
        return {"booked": [], "removed": []}
    removed = []
    if st.stage == 2:
        for p in (await ctx.session.execute(select(Placement).where(Placement.source == "riley", Placement.status == "scheduled"))).scalars().all():
            removed.append(await _undo(ctx, p, note="Riley left Booking small jobs"))
    st.stage = stage
    await record(ctx, "Setting", f"Moved Riley to “{STAGES[stage][0]}”.")
    booked = []
    if stage == 2:
        from app.optimizer.engine import optimize
        L = await load_snapshot(ctx)
        L.snap.win = (0, 13)   # prototype: the optimizer's current window, default 2 weeks
        limit = float(L.rules.riley_autobook_limit)
        res = optimize(L.snap)
        for mv in res.moves:
            job = L.snap.jobs[mv["jid"]]
            if not job.value < limit or mv["jid"] in L.snap.place:
                continue
            row = Placement(tenant_id=ctx.tenant_id, job_id=uuid.UUID(mv["jid"]), status="scheduled", source="riley", half_day=mv.get("half"))
            ctx.session.add(row)
            await ctx.session.flush()
            ep = m.Placement(crew=mv["crew"], segs=[[mv["s"], mv["e"]]], status="scheduled", half=mv.get("half"))
            await _save(ctx, L, row, ep)
            ctx.session.add(SchedulingDecision(tenant_id=ctx.tenant_id, job_id=row.job_id, placement_id=row.id, kind="riley_book", actor_kind="riley",
                                               actor_id=None, actor_label="Riley", crew_ids=[mv["crew"]], visits=_visits(L, ep),
                                               chosen_score=mv["score"], top_crew_id=uuid.UUID(mv["top"]) if mv.get("top") else None,
                                               top_score=mv.get("topScore")))
            await record(ctx, "Riley", f"Riley booked {job.title} on {L.crew_names[mv['crew']]}, {dlabel(L.snap, mv['s'])} (under ${limit:,.0f}).",
                         entity_type="placement", entity_id=row.id, job_id=row.job_id)
            booked.append(mv["jid"])
    return {"booked": booked, "removed": removed}


async def _undo(ctx: Ctx, p: Placement, note: str) -> str:
    job = await ctx.session.get(Job, p.job_id)
    ctx.session.add(SchedulingDecision(tenant_id=ctx.tenant_id, job_id=p.job_id, placement_id=p.id, kind="riley_undo", actor_kind="person",
                                       actor_id=ctx.membership.id, actor_label=ctx.actor_label, crew_ids=[], visits=[], reason_code=note))
    await record(ctx, "Riley", f"Undid Riley’s booking of {job.title}.", entity_type="placement", entity_id=p.id, job_id=p.job_id)
    await ctx.session.delete(p)
    await ctx.session.flush()
    return str(p.job_id)


async def undo_booking(ctx: Ctx, job_id: uuid.UUID) -> None:
    p = (await ctx.session.execute(select(Placement).where(Placement.job_id == job_id))).scalar_one_or_none()
    if not p or p.source != "riley" or p.status != "scheduled":
        raise AppError(422, "not_riley_booking", "Riley didn’t book this job")
    await _undo(ctx, p, note="Undone by a scheduler")


async def habits(ctx: Ctx) -> list[AssistantHabit]:
    return (await ctx.session.execute(select(AssistantHabit).order_by(AssistantHabit.sort_order))).scalars().all()


async def update_habit(ctx: Ctx, habit_id: uuid.UUID, status: str | None, condition: dict | None, set_condition: bool) -> AssistantHabit:
    h = await ctx.session.get(AssistantHabit, habit_id)
    if not h:
        raise not_found("Habit")
    if set_condition:
        if condition is not None:
            bad = set(condition) - CONDITION_KEYS
            if bad or not condition:
                raise AppError(422, "validation_failed", f"Conditions use {', '.join(sorted(CONDITION_KEYS))}")
            if "job_type" in condition and not (await ctx.session.execute(select(RatingDimension).where(
                    RatingDimension.key == condition["job_type"], RatingDimension.kind == "job_type"))).scalar_one_or_none():
                raise AppError(422, "validation_failed", "Unknown job type")
        h.condition = condition
    if status:
        if status != h.status:
            # Kept habits go to the bottom of the list (v7)
            h.sort_order = max([x.sort_order for x in await habits(ctx)] + [0]) + 1 if status == "kept" else h.sort_order
            await record(ctx, "Setting", f"{'Kept' if status == 'kept' else 'Ignored' if status == 'ignored' else 'Reopened'} a habit Riley learned: {h.text}")
        h.status = status
    return h


async def answer(ctx: Ctx, q_id: uuid.UUID, ans: str) -> AssistantQuestion:
    q = await ctx.session.get(AssistantQuestion, q_id)
    if not q:
        raise not_found("Question")
    if ans not in q.options:
        raise AppError(422, "validation_failed", "Pick one of the options", options=q.options)
    q.answer, q.answered_by = ans, ctx.membership.id
    await record(ctx, "Riley", f"Answered Riley: “{q.text}” → {ans}.")
    if re.search(r"habit|Must-have|Nice", ans):
        n = min([x.sort_order for x in await habits(ctx)] + [0]) - 1
        ctx.session.add(AssistantHabit(tenant_id=ctx.tenant_id, text=f"From your answer: {ans}. ({q.text.split('.')[0]}.)", condition=None,
                                       status="kept", source="answer", sort_order=n))
    return q


async def set_learner(ctx: Ctx, membership_id: uuid.UUID, enabled: bool) -> None:
    mb = await ctx.session.get(Membership, membership_id)
    if not mb or mb.tenant_id != ctx.tenant_id:
        raise not_found("Member")
    row = (await ctx.session.execute(select(AssistantLearner).where(AssistantLearner.membership_id == membership_id))).scalar_one_or_none()
    if not row:
        row = AssistantLearner(tenant_id=ctx.tenant_id, membership_id=membership_id)
        ctx.session.add(row)
    row.enabled = enabled
    await record(ctx, "Setting", f"Riley {'learns from' if enabled else 'no longer learns from'} {mb.display_name}.")


async def refresh(ctx: Ctx) -> None:
    st = await state(ctx)
    st.last_refreshed_at = datetime.now(timezone.utc)
    n = len((await ctx.session.execute(select(AssistantObservation.id))).all()) + st.base_observed
    await record(ctx, "Riley", f"Updated Riley with {n} decisions.")


async def log(ctx: Ctx, scheduler: str | None) -> list[dict]:
    q = select(AssistantObservation).order_by(AssistantObservation.created_at.desc())
    if scheduler:
        q = q.where(AssistantObservation.scheduler_label == scheduler)
    obs = (await ctx.session.execute(q)).scalars().all()
    crews = {c.id: c.name for c in (await ctx.session.execute(select(Crew))).scalars()}
    jobs = {j.id: j.title for j in (await ctx.session.execute(select(Job).where(Job.id.in_([o.job_id for o in obs])))).scalars()}
    return [{"at": o.created_at, "scheduler": o.scheduler_label, "job_id": str(o.job_id), "job": jobs.get(o.job_id),
             "riley_pick": crews.get(o.riley_pick_crew_id) if o.riley_pick_crew_id else None, "picked": crews.get(o.chosen_crew_id),
             "reason": o.reason or "", "agreed": o.agreed, "used_in_training": o.used_in_training} for o in obs]


async def pick_detail(ctx: Ctx, job_id: uuid.UUID) -> dict:
    """Why this crew (MAT-12): the habit or top score, the runner-up, and up to 4 similar past decisions."""
    L = await load_snapshot(ctx)
    jid = str(job_id)
    if jid not in L.snap.jobs:
        raise not_found("Job")
    rows = rank(L.snap, jid)
    rp = riley_pick(L.snap, jid, rows)
    if not rp:
        return {"pick": None, "runner_up": None, "similar": []}
    ok = [r for r in rows if r.ok]
    me = next(r for r in ok if r.crew == rp["crew"])
    runner = next((r for r in ok if r.crew != rp["crew"]), None)
    jtype = L.snap.jobs[jid].type
    similar = []
    for o in (await ctx.session.execute(select(AssistantObservation).where(AssistantObservation.job_type == jtype)
                                         .order_by(AssistantObservation.created_at.desc()).limit(4))).scalars():
        j = await ctx.session.get(Job, o.job_id)
        similar.append({"job": j.title if j else None, "picked": L.crew_names.get(str(o.chosen_crew_id)), "agreed": o.agreed, "at": o.created_at})
    return {"pick": {**rp, "crew_name": L.crew_names[rp["crew"]], "score": me.score},
            "runner_up": {"crew_id": runner.crew, "crew_name": L.crew_names[runner.crew], "score": runner.score} if runner else None,
            "similar": similar}


async def accept_pick(ctx: Ctx, job_id: uuid.UUID) -> Placement:
    from app.scheduling import service as svc
    L = await load_snapshot(ctx)
    jid = str(job_id)
    if jid not in L.snap.jobs:
        raise not_found("Job")
    rp = riley_pick(L.snap, jid)
    if not rp:
        raise AppError(422, "no_crew_fits", "Riley has no pick for this job")
    r = await svc.place(ctx, job_id, uuid.UUID(rp["crew"]), None, False, None, None)
    r.placement.recommended_by, r.placement.recommended_crew_id = "riley", uuid.UUID(rp["crew"])
    return r.placement
