"""Placements and decisions: place, edit (drag), split, resize, confirm, move, unschedule, clear.

Phase 1: BRD-01 to BRD-11, MAT-09, MAT-10, CAL-05, CAL-06. Rules: BL-34 to BL-39.
Every operation runs in the request's transaction. Writes that commit a schedule (confirm, move, unschedule) take a
per-crew advisory lock and re-check inside it (DD-12). Edits check the placement version (If-Match).
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date

from sqlalchemy import delete, select, text

from app.assistant.engine import riley_pick
from app.assistant.models import AssistantHabit, AssistantObservation
from app.audit.service import record
from app.core.context import Ctx, check_version
from app.core.errors import AppError, not_found
from app.jobs.models import Job
from app.messaging.models import MessageBatch
from app.messaging.service import create_batch, job_messages
from app.settings.models import ProjectManager

from .engine import core as E
from .engine.model import Placement as EP
from .engine.ranking import dlabel, rank
from .models import Placement, PlacementCrew, PlacementVisit, SchedulingDecision
from .snapshot import LoadedSnapshot, load_snapshot

PICK_REASONS = ["Riley recommended", "Optimizer recommended", "Client asked for this crew", "Top crew is needed on another job",
                "Crew knows this home or client", "Pairing or training", "Schedule or travel reason", "Other"]
MOVE_REASONS = ["Weather", "Client asked", "Crew asked", "Fit in another job", "Other"]


@dataclass
class Result:
    placement: Placement | None
    decision: SchedulingDecision | None = None
    batch: MessageBatch | None = None
    riley_agreed: bool | None = None
    warnings: list[str] | None = None


# ---------- loading ----------

async def _ctx(ctx: Ctx, job_id: uuid.UUID) -> tuple[LoadedSnapshot, str, Job]:
    job = await ctx.session.get(Job, job_id)
    if not job:
        raise not_found("Job")
    L = await load_snapshot(ctx)
    jid = str(job_id)
    if jid not in L.snap.jobs:
        raise AppError(422, "not_in_queue", "This job isn't in the Ready to schedule queue")
    return L, jid, job


async def placement_for_job(ctx: Ctx, job_id: uuid.UUID) -> Placement | None:
    return (await ctx.session.execute(select(Placement).where(Placement.job_id == job_id))).scalar_one_or_none()


async def get_placement(ctx: Ctx, placement_id: uuid.UUID) -> Placement:
    p = await ctx.session.get(Placement, placement_id)
    if not p:
        raise not_found("Placement")
    return p


async def _lock_crews(ctx: Ctx, crew_ids) -> None:
    for cid in sorted({str(c) for c in crew_ids}):
        await ctx.session.execute(text("select pg_advisory_xact_lock(hashtext(:k))"), {"k": f"{ctx.tenant_id}:{cid}"})


async def _save(ctx: Ctx, L: LoadedSnapshot, row: Placement, ep: EP) -> None:
    """Write the engine placement's crews and visits to the database row."""
    await ctx.session.execute(delete(PlacementCrew).where(PlacementCrew.placement_id == row.id))
    await ctx.session.execute(delete(PlacementVisit).where(PlacementVisit.placement_id == row.id))
    await ctx.session.flush()
    ctx.session.add(PlacementCrew(tenant_id=ctx.tenant_id, placement_id=row.id, crew_id=uuid.UUID(ep.crew), role="lead"))
    for x in ep.extra:
        ctx.session.add(PlacementCrew(tenant_id=ctx.tenant_id, placement_id=row.id, crew_id=uuid.UUID(x), role="extra"))
    for i, (a, z) in enumerate(ep.segs, start=1):
        ctx.session.add(PlacementVisit(tenant_id=ctx.tenant_id, placement_id=row.id, seq=i, start_date=L.date(a), end_date=L.date(z)))
    row.half_day = ep.half
    await ctx.session.flush()


def _check_working_day(L: LoadedSnapshot, crew: str, d: int) -> None:
    if not E.day_cap(L.snap, crew, d):
        raise AppError(422, "non_working_day", f"{L.crew_names.get(crew, 'That crew')} doesn't work {L.snap.days[d].dow if 0 <= d < len(L.snap.days) else 'that day'}s. "
                                               "Pick a working day.")


def _visits(L: LoadedSnapshot, ep: EP) -> list[dict]:
    return [{"start": L.date(a).isoformat(), "end": L.date(z).isoformat()} for a, z in ep.segs]


def _snapshot_rows(L: LoadedSnapshot, rows) -> list[dict]:
    return [{"crew_id": r.crew, "crew": L.crew_names[r.crew], "ok": r.ok, "score": r.score,
             "fails": [{"code": f.code, "message": f.message} for f in r.fails]} for r in rows[:10]]


# ---------- place a draft (MAT-09, MAT-10, CAL-06, BRD-01) ----------

async def place(ctx: Ctx, job_id: uuid.UUID, lead_crew_id: uuid.UUID | None, start: date | None,
                manual: bool, reason_code: str | None, reason_note: str | None) -> Result:
    L, jid, job = await _ctx(ctx, job_id)
    snap = L.snap
    existing = await placement_for_job(ctx, job_id)
    if existing and existing.status == "scheduled":
        raise AppError(409, "already_scheduled", "This job is confirmed. Move it instead.")
    rows = rank(snap, jid)
    if lead_crew_id is None:
        top = next((r for r in rows if r.ok), None)
        if not top:
            raise AppError(422, "no_crew_fits", "No crew fits yet. Pick a crew yourself.")
        crew = top.crew
    else:
        crew = str(lead_crew_id)
        c = snap.crew(crew)
        if not c or c.status != "active":
            raise not_found("Crew")
    override = None
    if manual:  # "Pick a crew yourself" always asks why (BL-35)
        if not reason_code:
            top = next((r for r in rows if r.ok), None)
            raise AppError(422, "reason_required", f"Why {L.crew_names[crew]}?", reasons=PICK_REASONS,
                           top={"crew_id": top.crew, "score": top.score} if top else None)
        if reason_code == "Other" and not (reason_note or "").strip():
            raise AppError(422, "reason_note_required", "Add a comment for “Other”")
        override = reason_code + (f" ({reason_note.strip()})" if (reason_note or "").strip() else "")
    if start is not None:
        s = L.index(start)
        _check_working_day(L, crew, s)
    else:  # placeJob: the crew's ranked slot, else its earliest slot, else from the job's earliest day
        r = next((x for x in rows if x.crew == crew), None)
        B = E.bookings(snap, jid)
        sl = (r.slot if r else None) or E.earliest_slot(snap, snap.jobs[jid], crew, B) or E.span(snap, snap.jobs[jid], crew, snap.jobs[jid].earliest, B)
        s = sl.s
    snap.place.pop(jid, None)
    ep = E.set_place(snap, jid, crew, s, "draft", False, [])
    row = existing or Placement(tenant_id=ctx.tenant_id, job_id=job_id, status="draft", source="manual")
    if existing:
        row.version += 1
    row.override_reason, row.recommended_by, row.recommended_crew_id = override, None, None
    ctx.session.add(row)
    await ctx.session.flush()
    await _save(ctx, L, row, ep)
    warn = [f.message for f in next((x for x in rows if x.crew == crew), None).fails] if any(x.crew == crew for x in rows) else []
    if manual:
        await record(ctx, "Override", f"Picked {L.crew_names[crew]} by hand for {job.title}. Reason: {override}.", entity_type="placement",
                     entity_id=row.id, job_id=job.id)
    return Result(row, warnings=warn)


# ---------- edit a draft: drag, crews, half day, PM (BRD-02, BRD-06, BRD-07, CAL-05) ----------

def _engine_placement(L: LoadedSnapshot, jid: str) -> EP:
    ep = L.snap.place.get(jid)
    if not ep:
        raise not_found("Placement")
    return ep


async def edit(ctx: Ctx, placement_id: uuid.UUID, if_match: str | None, *, start: date | None = None, lead_crew_id: uuid.UUID | None = None,
               visit_seq: int | None = None, extra_crew_ids: list[uuid.UUID] | None = None, half_day: str | None = None,
               pm_id: uuid.UUID | None = None, pm_set: bool = False) -> Result:
    row = await get_placement(ctx, placement_id)
    check_version(row.version, if_match)
    L, jid, job = await _ctx(ctx, row.job_id)
    ep = _engine_placement(L, jid)
    changed = False
    if start is not None or lead_crew_id is not None:
        if row.status == "scheduled":
            raise AppError(409, "already_scheduled", "This job is confirmed. Moving it needs a reason; use move.")
        _apply_drag(L, jid, ep, start, lead_crew_id, visit_seq)
        changed = True
    if extra_crew_ids is not None:
        extras = [str(x) for x in extra_crew_ids if str(x) != ep.crew]
        for x in extras:
            if not L.snap.crew(x):
                raise not_found("Crew")
        added = [x for x in extras if x not in ep.extra]
        ep = E.set_place(L.snap, jid, ep.crew, E.place_start(ep), ep.status, False, extras)   # recomputes the span (prototype)
        for x in added:
            await record(ctx, "Decision", f"Added {L.crew_names[x]} as a second crew on {job.title}.", entity_type="placement",
                         entity_id=row.id, job_id=job.id)
        changed = True
    if half_day is not None:
        if not ep.half:
            raise AppError(422, "validation_failed", "Only half-day jobs have a morning or afternoon")
        ep.half = half_day
        changed = True
    if pm_set:
        if pm_id and not await ctx.session.get(ProjectManager, pm_id):
            raise not_found("Project manager")
        row.pm_id = pm_id
        pm = await ctx.session.get(ProjectManager, pm_id) if pm_id else None
        await record(ctx, "Edit", f"Project manager for {job.title}: {pm.name if pm else 'none'}.", entity_type="placement", entity_id=row.id, job_id=job.id)
    if changed:
        await _save(ctx, L, row, ep)
    row.version += 1
    return Result(row)


def _apply_drag(L: LoadedSnapshot, jid: str, ep: EP, start: date | None, lead_crew_id, visit_seq: int | None) -> None:
    """Prototype onDrop: shift visits by the day difference; a split job dragged on the same crew moves only that visit."""
    new_crew = str(lead_crew_id) if lead_crew_id else ep.crew
    seg = (visit_seq or 1) - 1
    if seg >= len(ep.segs):
        raise AppError(422, "validation_failed", "No such visit")
    new_idx = L.index(start) if start is not None else ep.segs[seg][0]
    _check_working_day(L, new_crew, new_idx)
    d = new_idx - ep.segs[seg][0]
    if len(ep.segs) > 1 and new_crew == ep.crew and visit_seq:
        ep.segs[seg] = [ep.segs[seg][0] + d, ep.segs[seg][1] + d]
        ep.segs.sort(key=lambda s: s[0])
    else:
        ep.segs = [[a + d, z + d] for a, z in ep.segs]
    if new_crew != ep.crew:
        ep.extra = [x for x in ep.extra if x != new_crew]
        ep.crew = new_crew


async def split(ctx: Ctx, placement_id: uuid.UUID, if_match: str | None) -> Result:
    """Split into two visits, or rejoin if already split (BRD-04)."""
    row = await get_placement(ctx, placement_id)
    check_version(row.version, if_match)
    L, jid, job = await _ctx(ctx, row.job_id)
    ep = _engine_placement(L, jid)
    if len(ep.segs) > 1:
        ep = E.set_place(L.snap, jid, ep.crew, E.place_start(ep), ep.status)
    else:
        E.split_visits(L.snap, jid)
        ep = L.snap.place[jid]
        if len(ep.segs) < 2:
            raise AppError(422, "cant_split", "This job needs at least two working days to split")
    await _save(ctx, L, row, ep)
    row.version += 1
    return Result(row)


async def resize(ctx: Ctx, placement_id: uuid.UUID, if_match: str | None, seq: int, end: date) -> Result:
    """Drag the end of the last visit; the other visit absorbs the difference so total work stays the same (BRD-05)."""
    row = await get_placement(ctx, placement_id)
    check_version(row.version, if_match)
    L, jid, job = await _ctx(ctx, row.job_id)
    ep = _engine_placement(L, jid)
    i = seq - 1
    if i != len(ep.segs) - 1:
        raise AppError(422, "validation_failed", "Only the last visit can be resized")
    e = L.index(end)
    if e < ep.segs[i][0]:
        raise AppError(422, "validation_failed", "The visit can't end before it starts")
    cs = E.crews_of(ep.crew, ep.extra)
    while e > ep.segs[i][0] and not E.cap_all(L.snap, cs, e):
        e -= 1
    ep.segs[i][1] = e
    E.rebalance(L.snap, jid, i)
    await _save(ctx, L, row, ep)
    row.version += 1
    return Result(row)


async def clear(ctx: Ctx, placement_id: uuid.UUID) -> None:
    row = await get_placement(ctx, placement_id)
    if row.status == "scheduled":
        raise AppError(409, "already_scheduled", "This job is confirmed. Unschedule it first.")
    await ctx.session.delete(row)


# ---------- confirm (BRD-08) ----------

def _auto_reason(L: LoadedSnapshot, jid: str, row: Placement, ep: EP) -> str | None:
    """Optimizer or kept-Riley-habit picks need no reason (v7 autoReason)."""
    if row.recommended_by and row.recommended_crew_id and str(row.recommended_crew_id) == ep.crew:
        return "Optimizer recommended" if row.recommended_by == "optimizer" else "Riley recommended"
    rp = riley_pick(L.snap, jid)
    if rp and rp["pattern"] and rp["crew"] == ep.crew:
        return "Riley recommended"
    return None


async def confirm_preview(ctx: Ctx, placement_id: uuid.UUID) -> dict:
    row = await get_placement(ctx, placement_id)
    L, jid, job = await _ctx(ctx, row.job_id)
    ep = _engine_placement(L, jid)
    rows = rank(L.snap, jid)
    best = next((r for r in rows if r.ok), None)
    me = next((r for r in rows if r.crew == ep.crew), None)
    needs = bool(best and best.crew != ep.crew and not row.override_reason and not _auto_reason(L, jid, row, ep))
    msgs = await job_messages(ctx, L.snap, job, E.crews_of(ep.crew, ep.extra), E.place_start(ep), E.place_end(ep), "confirm", row.pm_id)
    return {"reason_required": needs, "reasons": PICK_REASONS,
            "top": {"crew_id": best.crew, "crew_name": L.crew_names[best.crew], "score": best.score} if best else None,
            "chosen": {"crew_id": ep.crew, "crew_name": L.crew_names[ep.crew], "score": me.score if me else None},
            "conflicts": [L.date(d) for d in E.place_conf(L.snap, jid)], "messages": msgs}


async def confirm(ctx: Ctx, placement_id: uuid.UUID, if_match: str | None, reason_code: str | None, reason_note: str | None) -> Result:
    row = await get_placement(ctx, placement_id)
    check_version(row.version, if_match)
    if row.status == "scheduled":
        raise AppError(409, "already_scheduled", "This job is already confirmed")
    L0, jid, job = await _ctx(ctx, row.job_id)
    await _lock_crews(ctx, E.crews_of(L0.snap.place[jid].crew, L0.snap.place[jid].extra))
    L = await load_snapshot(ctx)   # re-read inside the lock
    ep = _engine_placement(L, jid)
    rows = rank(L.snap, jid)
    best = next((r for r in rows if r.ok), None)
    me = next((r for r in rows if r.crew == ep.crew), None)
    given = None
    if reason_code:
        if reason_code == "Other" and not (reason_note or "").strip():
            raise AppError(422, "reason_note_required", "Add a comment for “Other”")
        given = reason_code + (f" ({reason_note.strip()})" if (reason_note or "").strip() else "")
    ov = None
    if best and best.crew != ep.crew:
        ov = given or row.override_reason or _auto_reason(L, jid, row, ep)
        if not ov:
            raise AppError(422, "reason_required",
                           f"{L.crew_names[ep.crew]} isn’t the top-ranked crew. {L.crew_names[best.crew]} scored {best.score}, "
                           f"{L.crew_names[ep.crew]} scored {me.score if me else 0}. Add a reason so the decision is on record.",
                           reasons=PICK_REASONS, top={"crew_id": best.crew, "score": best.score}, chosen={"crew_id": ep.crew, "score": me.score if me else None})
    rp = riley_pick(L.snap, jid, rows)   # Riley's pick before the confirm (rileyLearn)
    conflicts = E.place_conf(L.snap, jid)
    row.status = "scheduled"
    row.version += 1
    crews = E.crews_of(ep.crew, ep.extra)
    crew_names = " + ".join(L.crew_names[c] for c in crews)
    s, e = E.place_start(ep), E.place_end(ep)
    if not ov:
        text = f"Confirmed {crew_names} for {job.title}, {dlabel(L.snap, s)} to {dlabel(L.snap, e)}. Top-ranked crew, match {me.score}."
    else:
        text = (f"Confirmed {crew_names} for {job.title}, {dlabel(L.snap, s)} to {dlabel(L.snap, e)}. Not the top-ranked crew "
                f"({me.score if me else 0} vs {f'{best.score} for {L.crew_names[best.crew]}' if best else 'none'}). Reason: {ov}.")
    dec = SchedulingDecision(tenant_id=ctx.tenant_id, job_id=job.id, placement_id=row.id, kind="override" if ov else "confirm",
                             actor_kind="person", actor_id=ctx.membership.id, actor_label=ctx.actor_label, crew_ids=crews,
                             visits=_visits(L, ep), reason_code=ov, top_crew_id=uuid.UUID(best.crew) if best else None,
                             top_score=best.score if best else None, chosen_score=me.score if me else None,
                             conflicts=[L.date(d).isoformat() for d in conflicts], score_snapshot=_snapshot_rows(L, rows))
    ctx.session.add(dec)
    await ctx.session.flush()
    await record(ctx, "Override" if ov else "Decision", text, entity_type="scheduling_decision", entity_id=dec.id, job_id=job.id)
    agreed = await _riley_learn(ctx, L, jid, job, dec, ep.crew, rp, ov)
    msgs = await job_messages(ctx, L.snap, job, crews, s, e, "confirm", row.pm_id)
    batch = await create_batch(ctx, trigger="confirm", title=f"{job.title} is confirmed", job=job, msgs=msgs, decision_id=dec.id)
    return Result(row, dec, batch, agreed)


async def _riley_learn(ctx: Ctx, L: LoadedSnapshot, jid: str, job: Job, dec: SchedulingDecision, crew: str, rp: dict | None, reason: str | None) -> bool:
    """Record what Riley would have picked; a disagreement becomes a new habit candidate (BL-49, BL-50)."""
    agreed = bool(rp and rp["crew"] == crew)
    who = ctx.membership.display_name
    ctx.session.add(AssistantObservation(tenant_id=ctx.tenant_id, decision_id=dec.id, job_id=job.id, job_type=L.snap.jobs[jid].type,
                                         scheduler_id=ctx.membership.id, scheduler_label=who,
                                         riley_pick_crew_id=uuid.UUID(rp["crew"]) if rp else None, chosen_crew_id=uuid.UUID(crew),
                                         agreed=agreed, reason=reason))
    if not agreed and rp:
        n = len((await ctx.session.execute(select(AssistantHabit.id))).all())
        ctx.session.add(AssistantHabit(tenant_id=ctx.tenant_id, status="new", source="observation", condition=None, evidence_count=1,
                                       sort_order=-n - 1,  # newest first, like the prototype's unshift
                                       text=f"{who} picked {L.crew_names[crew]} over {L.crew_names[rp['crew']]} for {job.title}"
                                            f"{'. Reason: ' + reason if reason else ''}."))
    return agreed


# ---------- move and unschedule a confirmed job (BRD-09, BRD-10) ----------

async def move(ctx: Ctx, placement_id: uuid.UUID, if_match: str | None, *, start: date | None, lead_crew_id: uuid.UUID | None,
               visit_seq: int | None, reason_code: str | None, reason_note: str | None) -> Result:
    row = await get_placement(ctx, placement_id)
    check_version(row.version, if_match)
    if row.status != "scheduled":
        raise AppError(409, "not_scheduled", "Only confirmed jobs are moved with a reason. Drag the draft instead.")
    if not reason_code:
        raise AppError(422, "reason_required", "Pick a reason for moving a confirmed job", reasons=MOVE_REASONS)
    L0, jid, job = await _ctx(ctx, row.job_id)
    old = L0.snap.place[jid]
    await _lock_crews(ctx, {*E.crews_of(old.crew, old.extra), *([str(lead_crew_id)] if lead_crew_id else [])})
    L = await load_snapshot(ctx)
    ep = _engine_placement(L, jid)
    before = {"crew_ids": E.crews_of(ep.crew, ep.extra), "visits": _visits(L, ep)}
    in_lock = E.place_start(ep) < L.rules.lock_days
    _apply_drag(L, jid, ep, start, lead_crew_id, visit_seq)
    await _save(ctx, L, row, ep)
    row.version += 1
    reason = reason_code + (f" ({reason_note.strip()})" if (reason_note or "").strip() else "")
    crews = E.crews_of(ep.crew, ep.extra)
    s, e = E.place_start(ep), E.place_end(ep)
    dec = SchedulingDecision(tenant_id=ctx.tenant_id, job_id=job.id, placement_id=row.id, kind="move", actor_kind="person",
                             actor_id=ctx.membership.id, actor_label=ctx.actor_label, crew_ids=crews, visits=_visits(L, ep), before=before,
                             reason_code=reason, conflicts=[L.date(d).isoformat() for d in E.place_conf(L.snap, jid)],
                             score_snapshot=_snapshot_rows(L, rank(L.snap, jid)))
    ctx.session.add(dec)
    await ctx.session.flush()
    await record(ctx, "Decision", f"Moved confirmed job {job.title} to {L.crew_names[ep.crew]}, {dlabel(L.snap, s)}. Reason: {reason}.",
                 entity_type="scheduling_decision", entity_id=dec.id, job_id=job.id)
    msgs = await job_messages(ctx, L.snap, job, crews, s, e, "move", row.pm_id)
    batch = await create_batch(ctx, trigger="move", title=f"{job.title} moved", job=job, msgs=msgs, decision_id=dec.id)
    return Result(row, dec, batch, warnings=[f"It started within your {L.rules.lock_days}-day no-move window."] if in_lock else [])


async def unschedule(ctx: Ctx, placement_id: uuid.UUID, if_match: str | None) -> Result:
    row = await get_placement(ctx, placement_id)
    check_version(row.version, if_match)
    if row.status != "scheduled":
        raise AppError(409, "not_scheduled", "This job isn't confirmed")
    L, jid, job = await _ctx(ctx, row.job_id)
    ep = _engine_placement(L, jid)
    crews = E.crews_of(ep.crew, ep.extra)
    msgs = await job_messages(ctx, L.snap, job, crews, E.place_start(ep), E.place_end(ep), "cancel", row.pm_id)
    row.status = "draft"
    row.version += 1
    dec = SchedulingDecision(tenant_id=ctx.tenant_id, job_id=job.id, placement_id=row.id, kind="unschedule", actor_kind="person",
                             actor_id=ctx.membership.id, actor_label=ctx.actor_label, crew_ids=crews, visits=_visits(L, ep))
    ctx.session.add(dec)
    await ctx.session.flush()
    await record(ctx, "Decision", f"Unscheduled {job.title}. Back to draft.", entity_type="scheduling_decision", entity_id=dec.id, job_id=job.id)
    batch = await create_batch(ctx, trigger="cancel", title=f"{job.title} is unscheduled", job=job, msgs=msgs, decision_id=dec.id)
    return Result(row, dec, batch)


async def handoff(ctx: Ctx, job_id: uuid.UUID) -> MessageBatch | None:
    """Send handoff: the PM's confirm message only (BRD-07, prototype pmsend)."""
    row = await placement_for_job(ctx, job_id)
    if not row or not row.pm_id:
        raise AppError(422, "no_pm", "Pick a project manager first")
    L, jid, job = await _ctx(ctx, job_id)
    ep = _engine_placement(L, jid)
    msgs = [m for m in await job_messages(ctx, L.snap, job, E.crews_of(ep.crew, ep.extra), E.place_start(ep), E.place_end(ep), "confirm", row.pm_id)
            if m.role == "pm"]
    return await create_batch(ctx, trigger="confirm", title=f"Handoff for {job.title}", job=job, msgs=msgs)
