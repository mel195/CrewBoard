"""Plan all, KPIs, open days (BL-40, BL-46, BL-62 to BL-64)."""
from __future__ import annotations

from dataclasses import dataclass, field

from .core import bookings, day_cap, occ, painter_days, set_place
from .model import Booking, Snapshot, js_round
from .ranking import imp, rank, ready


def job_order_key(snap: Snapshot, jid: str, options: dict[str, int]):
    """Important jobs first, then fewest crews that could take it, then earliest finish-by (BL-40)."""
    return (not bool(imp(snap, snap.jobs[jid])), options[jid], snap.jobs[jid].deadline)


@dataclass
class PlanAllResult:
    items: list[dict] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)


def plan_all(snap: Snapshot) -> PlanAllResult:
    """Clear unconfirmed placements, then give each waiting job its top passing crew at its earliest slot.

    Mutates `snap.place` (callers pass a copy and persist the result as drafts).
    """
    res = PlanAllResult()
    todo = [j for j in snap.queue if not (snap.place.get(j) and snap.place[j].status == "scheduled")]
    for j in todo:
        snap.place.pop(j, None)
    opts = {j: sum(1 for x in rank(snap, j) if x.ok) for j in todo}
    todo.sort(key=lambda j: job_order_key(snap, j, opts))
    for j in todo:
        r = next((x for x in rank(snap, j) if x.ok), None)
        if not r:
            res.skipped.append(j)
            continue
        set_place(snap, j, r.crew, r.slot.s, "draft")
        res.items.append({"jid": j, "crew": r.crew, "s": r.slot.s, "e": r.slot.e, "score": r.score})
    return res


def open_days(snap: Snapshot, B: list[Booking] | None = None, frm: int = 0, to: int = 13) -> float:
    B = bookings(snap) if B is None else B
    n = 0.0
    for c in snap.active_crews():
        if not (ready(snap, c) or (snap._oc and c.size and c.base)):
            continue
        for d in range(frm, to + 1):
            if not day_cap(snap, c.id, d):
                continue
            n += 1 - occ(B, c.id, d)
    return n


def kpi_sched(snap: Snapshot, B: list[Booking] | None = None) -> dict:
    """% of crew days booked in the next 14 days, jobs and value on the calendar (BL-62, BL-63).

    Keeps a prototype quirk: an extra crew's booking carries value 0 and overwrites the job's value
    in the job map (G-xx, see Phase 2 decisions). Preserved for parity.
    """
    B = bookings(snap) if B is None else B
    pd = cap = 0.0
    jobs: dict[str, float] = {}
    for x in B:
        if x.prop:
            continue
        c = snap.crew(x.crew)
        sz = (c.plan_size if c else None) or 1
        for d in range(max(0, x.s), min(13, x.e) + 1):
            k = day_cap(snap, x.crew, d)
            if not k:
                continue
            pd += sz * k * (0.5 if x.half else 1)
            jobs[x.jid or x.id] = x.value or 0
    for c in snap.active_crews():
        if not c.size:
            continue
        for d in range(14):
            cap += c.plan_size * day_cap(snap, c.id, d)
    return {"pd": js_round(pd), "cap": js_round(cap), "pct": js_round(pd / cap * 100) if cap else 0,
            "jobs": len(jobs), "val": sum(jobs.values())}


def kpi_waiting(snap: Snapshot) -> dict:
    w = [j for j in snap.queue if not (snap.place.get(j) and snap.place[j].status == "scheduled")]
    return {"n": len(w), "pd": js_round(sum(painter_days(snap.jobs[j]) for j in w)), "val": sum(snap.jobs[j].value for j in w)}
