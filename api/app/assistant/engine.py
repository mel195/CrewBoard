"""Riley's pick (BL-48). Habits use structured conditions instead of JavaScript test functions (DD-09)."""
from __future__ import annotations

from app.scheduling.engine.model import Habit, Job, Snapshot
from app.scheduling.engine.ranking import rank


def habit_matches(h: Habit, job: Job) -> bool:
    """Condition keys: job_type (str), min_value (number), skills_any (list). All given keys must hold.
    A habit with no condition never matches (same as the prototype's `test: () => false`)."""
    c = h.condition
    if not c:
        return False
    if "job_type" in c and job.type != c["job_type"]:
        return False
    if "min_value" in c and not (job.value >= c["min_value"]):
        return False
    if "skills_any" in c and not any(s in job.skills for s in c["skills_any"]):
        return False
    return True


def riley_pick(snap: Snapshot, jid: str, rows=None) -> dict | None:
    job = snap.jobs[jid]
    R = [r for r in (rows if rows is not None else rank(snap, jid)) if r.ok]
    if not R:
        return None
    for h in snap.habits:
        if h.status == "kept" and h.crew and habit_matches(h, job) and any(r.crew == h.crew for r in R):
            return {"crew": h.crew, "why": h.text, "n": h.n, "pattern": True}
    av = next((h for h in snap.habits if h.status == "kept" and h.avoid and habit_matches(h, job)), None)
    pick = next((r for r in R if not av or r.crew != av.avoid), None) or R[0]
    return {"crew": pick.crew, "why": "Agrees with the ranking." if pick is R[0] else av.text, "pattern": pick is not R[0]}
