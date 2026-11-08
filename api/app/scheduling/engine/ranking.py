"""Rules, factors, score and ranking. Port of hard/factors/score/rank/whyLines (BL-09 to BL-33)."""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from .core import Span, bookings, day_cap, earliest_slot, occ
from .model import Booking, Crew, Job, Snapshot, js_round

MONTH_FMT = "{m} {n}"
FACTOR_LABELS = {  # prototype OPS
    "jobType": "Job type rating", "skills": "Skills this job needs", "record": "Days used vs sold", "cost": "Cost per painter day",
    "distance": "Drive time", "timing": "Start date", "balance": "Workload balance", "language": "Speaks the client’s language",
}


# ---------- small helpers ----------

def plural(n: int, w: str) -> str:
    return f"{n} {w}{'' if n == 1 else 's'}"


def money(v: float) -> str:
    return "$" + f"{js_round(v):,}"


def sdate(snap: Snapshot, i: int) -> str:
    return f"{snap.days[i].m} {snap.days[i].n}" if 0 <= i < len(snap.days) else "later"


def dlabel(snap: Snapshot, i: int) -> str:
    return f"{snap.days[i].dow} {snap.days[i].m} {snap.days[i].n}" if 0 <= i < len(snap.days) else "later"


def drive_min(snap: Snapshot, frm: str | None, to: str | None) -> int | None:
    """Prototype drive-time estimate (BL-09): km distance x 1.3 + 6 minutes."""
    a, b = snap.geo.get(frm or ""), snap.geo.get(to or "")
    if not a or not b:
        return None
    dy = (b[0] - a[0]) * 111
    dx = (b[1] - a[1]) * 100
    return js_round(math.hypot(dx, dy) * 1.3 + 6)


# ---------- readiness (BL-11) ----------

def missing(snap: Snapshot, c: Crew) -> list[str]:
    m: list[str] = []
    if not c.status:
        m.append("status")
    if not c.size:
        m.append("size")
    if not c.base:
        m.append("base")
    if not any(c.ratings.get(d.k) is not None for d in snap.dims_of("job")):
        m.append("jobRating")
    if not c.region and "region" not in m:  # v5
        m.insert(len(m) - 1 if m and m[-1] == "jobRating" else len(m), "region")
    return m


def ready(snap: Snapshot, c: Crew) -> bool:
    return c.status == "active" and not missing(snap, c)


# ---------- important client (BL-20) ----------

def imp_why(snap: Snapshot, job: Job) -> list[str]:
    sig = job.signals or {}
    out: list[str] = []
    checks = [
        ("returning", lambda: f"Returning client ({sig['returning']})" if sig.get("returning") else None),
        ("referrals", lambda: f"Has referred {sig.get('referrals')} jobs" if (sig.get("referrals") or 0) >= 2 else None),
        ("value", lambda: f"{money(job.value)} job" if job.value >= snap.imp_value else None),
        ("crm", lambda: "Tagged VIP in the CRM" if sig.get("crm") else None),
        ("trade", lambda: sig.get("trade") or None),
        ("manual", lambda: f"Estimator note: {sig['manual']}" if sig.get("manual") else None),
    ]
    for key, fn in checks:
        if snap.imp_on.get(key):
            r = fn()
            if r:
                out.append(r)
    return out


def imp(snap: Snapshot, job: Job) -> str | None:
    w = imp_why(snap, job)
    return ", ".join(w) if w else None


def label_for(snap: Snapshot, jid: str) -> str:
    lab = snap.job_label.get(jid)
    if lab and lab in snap.labels:
        return lab
    return "White glove" if imp(snap, snap.jobs[jid]) else "Balanced"


def weights(snap: Snapshot, jid: str) -> dict[str, float]:
    return snap.job_weights.get(jid) or snap.labels[label_for(snap, jid)]


# ---------- rules that rule a crew out (BL-10 to BL-17) ----------

@dataclass
class RuleFailure:
    code: str
    message: str


def hard(snap: Snapshot, job: Job, cid: str) -> list[RuleFailure]:
    c = snap.crew(cid)
    R = snap.rules
    out: list[RuleFailure] = []
    if c.status != "active":
        return [RuleFailure("inactive", "Inactive")]
    mi = [x for x in missing(snap, c) if x != "jobRating"]
    if mi:
        names = ["crew size" if x == "size" else "home base" if x == "base" else x for x in mi]
        out.append(RuleFailure("missing_setup", f"Missing setup: {', '.join(names)}"))
    r = c.ratings.get(job.type)
    tl = snap.dim_label(job.type).lower()
    if r is None:
        if not R.untested:
            out.append(RuleFailure("not_rated", f"Not rated for {tl} yet"))
    elif r < R.min_type:
        out.append(RuleFailure("below_min_rating", f"Rated {r} for {tl}, minimum is {R.min_type}"))
    # painting trade rule (BL-13)
    if R.lead and job.built is not None and job.built < 1978 and snap.lead_tracked and c.lead_safe is not True:
        out.append(RuleFailure("lead_safe", f"No lead-safe certification on file (home built {job.built})"))
    if R.imp and imp(snap, job):
        q, cf = c.ratings.get("quality"), c.ratings.get("client")
        if q is None or cf is None or q < R.imp_bar or cf < R.imp_bar:
            out.append(RuleFailure("important_bar", f"Important client: needs quality and client-facing {R.imp_bar}+"))
    if R.region and c.region and job.region and c.region != job.region:
        out.append(RuleFailure("region", f"Works in {c.region}, job is in {job.region}"))
    dm = drive_min(snap, c.base, job.area)
    if dm is not None and dm > R.max_drive and not (R.region and c.region != job.region):
        out.append(RuleFailure("drive_limit", f"{dm} min away, limit is {R.max_drive}"))
    rc = c.review_counts.get(job.type) or 0
    if R.min_reviews > 1 and r is not None and rc < R.min_reviews and c.rating_sources.get(job.type) != "admin":
        out.append(RuleFailure("few_reviews", f"{snap.dim_label(job.type)} rating is based on {plural(rc, 'review')}, needs {R.min_reviews}"))
    return out


# ---------- factors and score (BL-23 to BL-33) ----------

def hist(snap: Snapshot, cid: str) -> dict | None:
    h = snap.hist.get(cid)
    if not h:
        return None
    return {**h, "overPct": js_round((h["actual"] - h["sold"]) / h["sold"] * 1000) / 10,
            "payAct": js_round(h["pay"] / h["actual"]), "costSold": js_round(h["pay"] / h["sold"])}


def r20(v):
    return None if v is None else js_round(v * 20)


def util(snap: Snapshot, B: list[Booking], crew: str, days: int = 28) -> int:
    n, w = 0.0, 0
    for d in range(days):
        if not day_cap(snap, crew, d):
            continue
        w += 1
        n += occ(B, crew, d)
    return js_round(n / w * 100) if w else 0


def _clamp(x: float) -> int:
    return max(0, min(100, js_round(x)))


def factors(snap: Snapshot, job: Job, cid: str, slot: Span | None, B: list[Booking]) -> dict[str, float]:
    c = snap.crew(cid)
    f: dict[str, float] = {}
    h = hist(snap, cid)
    jt = r20(c.ratings.get(job.type))
    f["jobType"] = 50 if jt is None else jt
    sk = [c.ratings.get(k) for k in job.skills if c.ratings.get(k) is not None]
    f["skills"] = js_round(sum(sk) / len(sk) * 20) if sk else 60
    for d in snap.dims_of("attr"):
        v = r20(c.ratings.get(d.k))
        f[d.k] = 60 if v is None else v
    f["record"] = _clamp(100 - max(0, h["overPct"]) * 6) if h else 60
    f["cost"] = _clamp(70 + (snap.avg_cost - h["costSold"]) / snap.avg_cost * 300) if h else 60
    dm = drive_min(snap, c.base, job.area)
    f["distance"] = 50 if dm is None else max(0, 100 - dm * 2)
    delay = slot.s - job.earliest if slot else 10
    f["timing"] = max(0, 100 - delay * 12)
    f["balance"] = 100 - util(snap, B, cid)
    if job.lang == "en":
        f["language"] = 80
    else:
        word = snap.langs.get(job.lang, job.lang).split(" ")[-1].lower()
        f["language"] = 100 if snap.lang_tracked and word in (c.languages or "").lower() else 30
    return f


def score(f: dict[str, float], w: dict[str, float]) -> int:
    t = s = 0.0
    for k, wk in w.items():
        if f.get(k) is None:
            continue
        t += wk * f[k]
        s += wk
    return js_round(t / s) if s else 0


@dataclass
class RankRow:
    crew: str
    ok: bool
    fails: list[RuleFailure]
    slot: Span | None
    f: dict[str, float]
    score: int
    needs_rating: bool
    extra: dict = field(default_factory=dict)


def rank(snap: Snapshot, jid: str, w: dict[str, float] | None = None, job: Job | None = None) -> list[RankRow]:
    """Every active crew for a job: rule checks, earliest slot, factors, score. Passing crews first, then score."""
    job = job or snap.jobs[jid]
    B = bookings(snap, jid)
    w = w or weights(snap, jid)
    rows = []
    for c in snap.active_crews():
        fails = hard(snap, job, c.id)
        slot = earliest_slot(snap, job, c.id, B)
        if slot and slot.e > job.deadline:
            fails.append(RuleFailure("after_deadline", f"Earliest finish {sdate(snap, slot.e)}, after the {sdate(snap, job.deadline)} deadline"))
        if not slot:
            fails.append(RuleFailure("no_opening", "No opening in the next 4 weeks"))
        f = factors(snap, job, c.id, slot, B)
        rows.append(RankRow(c.id, not fails, fails, slot, f, score(f, w), c.ratings.get(job.type) is None))
    rows.sort(key=lambda r: (not r.ok, -r.score))
    return rows


def why_lines(snap: Snapshot, job: Job, r: RankRow) -> dict:
    """Top 3 reasons and one weakness (prototype whyLines)."""
    c = snap.crew(r.crew)
    w = weights(snap, job.id)
    h = hist(snap, r.crew)
    dm = drive_min(snap, c.base, job.area)
    L: list[tuple[str, float, str]] = []

    def add(k: str, t: str) -> None:
        L.append((k, (r.f.get(k) or 0) * (w.get(k) or 0.1), t))

    def rv(k):
        v = c.ratings.get(k)
        return "not rated" if v is None else v

    jr = c.ratings.get(job.type, "undefined")
    add("jobType", f"Rated {'null' if jr is None else jr} of 5 for {snap.dim_label(job.type).lower()}")
    if job.skills:
        add("skills", ", ".join(f"{snap.dim_label(k)} {rv(k)}" for k in job.skills))
    add("quality", f"Quality {rv('quality')}, reliability {rv('reliability')}")
    add("record", (f"Used {_num(abs(h['overPct']))}% fewer" if h['overPct'] <= 0 else f"Used {_num(h['overPct'])}% more") + " painter days than sold" if h else "No job history yet")
    add("distance", f"{dm} min drive from {c.base}" if dm is not None else "Home base not set")
    if r.slot and r.slot.s == job.earliest:
        add("timing", f"Can start {dlabel(snap, r.slot.s)}, the first possible day")
    else:
        add("timing", f"First opening is {dlabel(snap, r.slot.s) if r.slot else 'not in the next 4 weeks'}")
    if job.lang != "en":
        lname = snap.langs.get(job.lang, job.lang)
        add("language", f"Speaks {lname} with the client" if r.f["language"] >= 100 else f"Nobody listed who speaks {lname}")
    s = sorted(L, key=lambda x: -x[1])
    plus = [x[2] for x in s[:3]]
    keys = [k for k in w if w[k] > 0 and r.f.get(k) is not None]
    minus_k = sorted(keys, key=lambda k: r.f[k])[0] if keys else None
    mt = None
    if minus_k and r.f[minus_k] < 70:
        texts = {
            "timing": f"Can’t start until {dlabel(snap, r.slot.s) if r.slot else 'later'}",
            "distance": f"{'null' if dm is None else dm} min drive",  # prototype prints "null" when no base (kept for parity)
            "record": f"Used {_num(h['overPct'])}% more painter days than sold" if h else "No job history yet",
            "cost": "Costs more per painter day than average",
            "balance": f"Already {_num(100 - r.f['balance'])}% booked",
            "language": f"Nobody listed who speaks {snap.langs.get(job.lang, job.lang)}",
        }
        mt = texts.get(minus_k) or f"{FACTOR_LABELS.get(minus_k) or snap.dim_label(minus_k)} is lower ({_num(r.f[minus_k])})"
    return {"plus": plus, "minus": mt}


def _num(x: float) -> str:
    """Format a number the way JavaScript prints it in a template string."""
    return str(int(x)) if float(x).is_integer() else repr(float(x))
