"""Capacity, bookings, spans and slots. Port of the prototype's final (post-v6) functions.

Phase 1 rules: BL-01 to BL-08. Every function here is pure over a Snapshot, except set_place,
split_visits and rebalance, which edit a Placement in the given snapshot (callers pass a copy).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .model import Booking, Job, Placement, Snapshot, js_round


# ---------- capacity (BL-02, BL-03) ----------

def t_h(x: str) -> float:
    a, _, b = str(x).partition(":")
    return int(a) + (int(b) if b else 0) / 60


def day_cap(snap: Snapshot, cid: str, d: int) -> float:
    c = snap.crew(cid)
    if not c or d < 0 or d >= len(snap.days):
        return 0
    dow = snap.days[d].dow
    h = c.hours or snap.hours_default
    if dow == "Sat":
        r = h.sat
    elif dow == "Sun":
        r = h.sun
    else:
        r = h.wk or snap.hours_default.wk
    if not r:
        return 0
    length = t_h(r[1]) - t_h(r[0])
    return max(0, min(1, (length - 1 if length > 6 else length) / 8))


def cap_all(snap: Snapshot, cs: list[str], d: int) -> float:
    return min(day_cap(snap, x, d) for x in cs)


def rain(snap: Snapshot, d: int) -> bool:
    return 0 <= d < snap.rain_days and d < len(snap.rain_prob) and snap.rain_prob[d] >= snap.rain_threshold


# ---------- crews on a job ----------

def crews_of(crew: str, extra: list[str] | None) -> list[str]:
    return [crew, *[x for x in (extra or []) if x and x != crew]]


def combo_size(snap: Snapshot, crew: str, extra: list[str] | None) -> int:
    return sum((snap.crew(c).plan_size if snap.crew(c) else None) or 1 for c in crews_of(crew, extra))


def painter_days(job: Job) -> float:
    return js_round(job.hours / 8 * 10) / 10


# ---------- bookings (BL-07) ----------

def bookings(snap: Snapshot, except_job: str | None = None) -> list[Booking]:
    out: list[Booking] = []
    for x in snap.fixed:
        k = snap.shift.get(x.id, 0) or 0
        out.append(Booking(id=x.id, crew=snap.reassign.get(x.id) or x.crew, s=x.s + k, e=x.e + k, name=x.name, what=x.what,
                           value=x.value, half=x.half, fixed=True, moved=k))
    for jid, p in snap.place.items():
        if jid == except_job or jid not in snap.jobs:
            continue
        job = snap.jobs[jid]
        for cr in crews_of(p.crew, p.extra):
            for i, (a, z) in enumerate(p.segs):
                out.append(Booking(id=f"job:{jid}:{i}:{cr}", crew=cr, s=a, e=z, name=job.title,
                                   what="Confirmed" if p.status == "scheduled" else "Draft", jid=jid,
                                   seg=i + 1 if len(p.segs) > 1 else 0, prop=p.status != "scheduled", half=p.half or None,
                                   value=job.value if cr == p.crew else 0, extra_crew=cr != p.crew))
    return out


def occ(B: list[Booking], crew: str, d: int) -> float:
    full = False
    halves: set[str] = set()
    for x in B:
        if x.crew == crew and x.s <= d <= x.e:
            if x.half:
                halves.add(x.half)
            else:
                full = True
    return 1 if full else 1 if len(halves) >= 2 else 0.5 if halves else 0


def busy(B: list[Booking], crew: str, d: int) -> bool:
    return occ(B, crew, d) > 0


def free_half(B: list[Booking], crew: str, d: int) -> str | None:
    used = {x.half for x in B if x.crew == crew and x.half and x.s <= d <= x.e}
    if occ(B, crew, d) == 1:
        return None
    return "am" if "am" not in used else "pm" if "pm" not in used else None


def half_taken(B: list[Booking], crew: str, d: int, h: str) -> bool:
    return any(x.crew == crew and x.s <= d <= x.e and (not x.half or x.half == h) for x in B)


# ---------- need, span, earliest slot (BL-04 to BL-06) ----------

@dataclass
class Need:
    n: int
    half: bool


@dataclass
class Span:
    s: int
    e: int
    holds: list[int] = field(default_factory=list)
    conf: list[int] = field(default_factory=list)
    n: int = 1
    half: str | None = None


def need(snap: Snapshot, job: Job, crew: str, extra: list[str] | None = None) -> Need:
    days = job.hours / 8 / combo_size(snap, crew, extra)
    return Need(1, True) if days <= 0.5 else Need(_ceil(days), False)


def _ceil(x: float) -> int:
    i = int(x)
    return i if i == x else i + 1


def is_rain_hold(snap: Snapshot, job: Job, d: int) -> bool:
    """Painting trade rule: exterior job, weather rule on, rain at or above threshold."""
    return job.ext and snap.rules.weather and rain(snap, d)


def span(snap: Snapshot, job: Job, crew: str, start: int, B: list[Booking], extra: list[str] | None = None) -> Span:
    nd = need(snap, job, crew, extra)
    cs = crews_of(crew, extra)
    if nd.half:
        h = free_half(B, crew, start)
        return Span(s=start, e=start, holds=[], conf=[] if h and cap_all(snap, cs, start) else [start], n=1, half=h or "am")
    c, d, first = 0.0, start, True
    holds: list[int] = []
    conf: list[int] = []
    while c < nd.n - 1e-6:
        if d > snap.span_horizon:
            break
        cap = cap_all(snap, cs, d)
        if not cap:
            d += 1
            continue
        if any(busy(B, x, d) for x in cs):
            conf.append(d)
        if is_rain_hold(snap, job, d) and not (first and nd.n >= 3):
            holds.append(d)
        else:
            c += cap
            first = False
        d += 1
    return Span(s=start, e=d - 1, holds=holds, conf=conf, n=nd.n, half=None)


def earliest_slot(snap: Snapshot, job: Job, crew: str, B: list[Booking]) -> Span | None:
    for s in range(job.earliest, snap.slot_horizon + 1):
        if not day_cap(snap, crew, s):
            continue
        sp = span(snap, job, crew, s, B)
        if not sp.conf:
            return sp
    return None


# ---------- placements (BL-08, BL-34) ----------

def set_place(snap: Snapshot, jid: str, crew: str, s: int, status: str = "draft", keep_segs: bool = False,
              extra: list[str] | None = None) -> Placement:
    job = snap.jobs[jid]
    old = snap.place.get(jid)
    if extra is None:
        extra = [x for x in old.extra if x != crew] if old and old.extra else []
    sp = span(snap, job, crew, s, bookings(snap, jid), extra)
    segs = [[sp.s, sp.e]]
    if keep_segs and old and len(old.segs) > 1:
        d = s - old.segs[0][0]
        segs = [[a + d, z + d] for a, z in old.segs]
    p = Placement(crew=crew, extra=list(extra), segs=segs, status=status or "draft", half=sp.half, holds=sp.holds)
    snap.place[jid] = p
    return p


def place_start(p: Placement) -> int:
    return p.segs[0][0]


def place_end(p: Placement) -> int:
    return p.segs[-1][1]


def place_conf(snap: Snapshot, jid: str) -> list[int]:
    p = snap.place[jid]
    B = bookings(snap, jid)
    cs = crews_of(p.crew, p.extra)
    out = []
    for a, z in p.segs:
        for d in range(a, z + 1):
            if not cap_all(snap, cs, d):
                continue
            if any(half_taken(B, cr, d, p.half) if p.half else busy(B, cr, d) for cr in cs):
                out.append(d)
    return out


def place_days(snap: Snapshot, jid: str) -> list[dict]:
    p = snap.place[jid]
    job = snap.jobs[jid]
    cs = crews_of(p.crew, p.extra)
    out: list[dict] = []
    w = 0
    n = need(snap, job, p.crew, p.extra).n
    for si, (a, z) in enumerate(p.segs):
        if si > 0:
            for d in range(p.segs[si - 1][1] + 1, a):
                if cap_all(snap, cs, d):
                    out.append({"d": d, "k": "pause"})
        for d in range(a, z + 1):
            if not cap_all(snap, cs, d):
                continue
            h = is_rain_hold(snap, job, d) and not (w == 0 and n >= 3) and not p.half
            if h:
                out.append({"d": d, "k": "rain", "n": None})
            else:
                w += 1
                out.append({"d": d, "k": "work", "n": w})
    return out


def _cap_w(snap: Snapshot, job: Job, cs: list[str], d: int) -> float:
    return cap_all(snap, cs, d) * (0 if is_rain_hold(snap, job, d) else 1)


def _seg_cap(snap: Snapshot, job: Job, cs: list[str], a: int, z: int) -> float:
    return sum(_cap_w(snap, job, cs, d) for d in range(a, z + 1))


def _next_work(snap: Snapshot, cs: list[str], d: int) -> int:
    while d < snap.span_horizon + 1 and not cap_all(snap, cs, d):
        d += 1
    return d


def rebalance(snap: Snapshot, jid: str, fixed: int) -> str:
    """Keep total work equal to the need when one visit changes (BL-08)."""
    p = snap.place[jid]
    job = snap.jobs[jid]
    cs = crews_of(p.crew, p.extra)
    n = need(snap, job, p.crew, p.extra).n
    f = p.segs[fixed]
    rem = n - _seg_cap(snap, job, cs, f[0], f[1])
    o = 1 if fixed == 0 else 0
    if rem <= 0.01:
        p.segs = [f]
        return "one"
    if len(p.segs) <= o:
        p.segs.append([_next_work(snap, cs, _next_work(snap, cs, f[1] + 1) + 1), 0])
    g = p.segs[o]
    limit = snap.span_horizon + 1
    if o > fixed:
        if g[0] <= f[1] + 1:
            g[0] = _next_work(snap, cs, f[1] + 2)
        g[0] = _next_work(snap, cs, g[0])
        c, d = 0.0, g[0]
        while d < limit:
            c += _cap_w(snap, job, cs, d)
            if c >= rem - 1e-6:
                break
            d += 1
        g[1] = d
    else:
        g[0] = _next_work(snap, cs, g[0])
        c, d = 0.0, g[0]
        while d < limit:
            c += _cap_w(snap, job, cs, d)
            if c >= rem - 1e-6:
                break
            d += 1
        g[1] = d
        if g[1] >= f[0] - 1:
            sh = g[1] - f[0] + 2
            f[0] += sh
            f[1] += sh
            f[0] = _next_work(snap, cs, f[0])
    p.segs.sort(key=lambda s: s[0])
    return "two"


def split_visits(snap: Snapshot, jid: str) -> None:
    p = snap.place[jid]
    cs = crews_of(p.crew, p.extra)
    wd = [d for d in range(place_start(p), place_end(p) + 1) if cap_all(snap, cs, d)]
    if len(wd) < 2:
        return
    k = _ceil(len(wd) / 2)
    p.segs = [[wd[0], wd[k - 1]]]
    rebalance(snap, jid, 0)
