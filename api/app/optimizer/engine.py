"""Optimizer engine: port of the prototype's optimize() with the v6/v7 wrappers (BL-40 to BL-47).

Pure: works on a copy of the snapshot and returns a proposal. Applying it is the service's job.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.scheduling.engine.core import bookings, busy, day_cap, occ, painter_days, span
from app.scheduling.engine.model import Placement, Snapshot, js_round
from app.scheduling.engine.planning import job_order_key, open_days
from app.scheduling.engine.ranking import RankRow, dlabel, hist, rank


def crew_pay(snap: Snapshot, job, cid: str) -> dict:
    h = hist(snap, cid)
    rate = h["costSold"] if h else snap.avg_cost
    return {"amt": js_round(painter_days(job) * rate / 10) * 10, "rate": rate,
            "src": "their cost per painter day sold" if h else "company average per painter day"}


def margin(snap: Snapshot, jid: str, cid: str) -> int | None:
    job = snap.jobs.get(jid)
    if not job or not job.value:
        return None
    return js_round((job.value - crew_pay(snap, job, cid)["amt"]) / job.value * 100)


def mg_score(snap: Snapshot, jid: str, cid: str) -> float:
    if not snap.opt_margin:
        return 0
    m = margin(snap, jid, cid)
    return 0 if m is None else (m - 55) / 4


ALL_CREWS_OK_CODES = {"not_rated", "few_reviews"}


def all_crews_ok(snap: Snapshot, r: RankRow) -> bool:
    """All-crews mode: crews that only fail for missing ratings or reviews (BL-44; uses codes, DD-19)."""
    if not snap._oc or not r.slot:
        return False
    c = snap.crew(r.crew)
    if not c.size or not c.base:
        return False
    return all(f.code in ALL_CREWS_OK_CODES for f in r.fails)


@dataclass
class OptimizerResult:
    win: tuple[int, int]
    moves: list[dict] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    before: float = 0
    after: float = 0
    lock: int = 5
    opt_all: bool = False
    opt_margin: bool = False


def optimize(snap_in: Snapshot, keep: dict | None = None) -> OptimizerResult:
    snap = snap_in.copy()
    snap._oc = snap.opt_all
    F = snap.ofb
    W = snap.win
    before = keep["before"] if keep else open_days(snap, bookings(snap), *W)
    kept = (keep or {}).get("kept") or []
    for mv in kept:
        if mv.get("shift"):
            snap.shift[mv["shift"]["id"]] = (snap.shift.get(mv["shift"]["id"]) or 0) + mv["shift"]["k"]
        snap.place[mv["jid"]] = Placement(crew=mv["crew"], segs=[[mv["s"], mv["e"]]], status="draft", half=mv.get("half"))
    kept_ids = {m["jid"] for m in kept}
    todo = [j for j in snap.queue if not (snap.place.get(j) and snap.place[j].status == "scheduled")
            and j not in kept_ids and snap.jobs[j].earliest <= W[1]]
    for j in todo:
        snap.place.pop(j, None)
    opts = {j: sum(1 for x in rank(snap, j) if x.ok or all_crews_ok(snap, x)) for j in todo}
    todo.sort(key=lambda j: job_order_key(snap, j, opts))

    def blocked(jid, cr, s, e):
        return any((b["jid"] == jid if b.get("jid") else b.get("crew") == cr) and s <= b["e"] and e >= b["s"] for b in F.block)

    moves = [{**m, "kept": True} for m in kept]
    skipped: list[str] = []
    for jid in todo:
        job = snap.jobs[jid]
        R = [r for r in rank(snap, jid) if (r.ok or all_crews_ok(snap, r)) and r.crew not in (F.reject.get(jid) or [])]
        if not R:
            skipped.append(jid)
            continue
        cands: list[dict] = []
        for r in R:
            B = bookings(snap, jid)
            for s in range(max(job.earliest, W[0]), min(snap.slot_horizon, W[1]) + 1):
                if not day_cap(snap, r.crew, s):
                    continue
                sp = span(snap, job, r.crew, s, B)
                if blocked(jid, r.crew, sp.s, sp.e):
                    continue
                if not sp.conf and sp.e <= job.deadline:
                    fit = (1 if s > 0 and busy(B, r.crew, s - 1) else 0) + (1 if busy(B, r.crew, sp.e + 1) else 0) + \
                          (2 if sp.half and occ(B, r.crew, s) == 0.5 else 0)
                    cands.append({"v": fit * 6 - (s - job.earliest) * 2 + r.score / 10 + mg_score(snap, jid, r.crew),
                                  "mg": margin(snap, jid, r.crew), "notReady": not r.ok, "jid": jid, "crew": r.crew, "s": s,
                                  "e": sp.e, "half": sp.half, "score": r.score, "fit": fit, "shift": None})
                    continue
                if sp.half or not (s == job.earliest or busy(B, r.crew, s - 1)):
                    continue
                g = s
                while g + 1 <= snap.slot_horizon and not busy(B, r.crew, g + 1):
                    g += 1
                x = next((y for y in B if y.crew == r.crew and y.s == g + 1 and y.fixed), None)
                if not x or x.s < snap.lock or snap.shift.get(x.id) or F.no_move.get(x.id):
                    continue
                for k in (1, 2):
                    snap.shift[x.id] = k
                    sp2 = span(snap, job, r.crew, s, bookings(snap, jid))
                    Bx = [y for y in B if y.id != x.id]
                    clash = x.e + k > snap.slot_horizon
                    for d in range(x.e + 1, x.e + k + 1):
                        if busy(Bx, r.crew, d):
                            clash = True
                    del snap.shift[x.id]
                    if not sp2.conf and sp2.e <= job.deadline and not clash:
                        cands.append({"v": 12 - (s - job.earliest) * 2 + r.score / 10 - 4 + mg_score(snap, jid, r.crew),
                                      "mg": margin(snap, jid, r.crew), "notReady": not r.ok, "jid": jid, "crew": r.crew, "s": s,
                                      "e": sp2.e, "half": None, "score": r.score, "fit": 2,
                                      "shift": {"id": x.id, "k": k, "name": f"{x.name} {x.what.lower()}", "from": x.s}})
                        break
        cands.sort(key=lambda c: -c["v"])
        if not cands:
            skipped.append(jid)
            continue
        best = cands[0]
        best["top"] = R[0].crew
        best["topScore"] = R[0].score
        seen = {best["crew"]}
        alts = []
        for c in cands[1:]:
            if c["crew"] in seen:
                continue
            seen.add(c["crew"])
            alts.append(c)
        best["alts"] = [{"crew": c["crew"], "s": c["s"], "e": c["e"], "score": c["score"],
                         "why": f"Lower match score ({c['score']} vs {best['score']})" if c["score"] < best["score"]
                         else f"Starts later ({dlabel(snap, c['s'])})" if c["s"] > best["s"]
                         else "Would move a confirmed job" if c["shift"] else "Leaves more open days around it"} for c in alts[:3]]
        o1 = open_days(snap, bookings(snap), *W)
        if best["shift"]:
            snap.shift[best["shift"]["id"]] = best["shift"]["k"]
        snap.place[jid] = Placement(crew=best["crew"], segs=[[best["s"], best["e"]]], status="draft", half=best["half"])
        best["fill"] = js_round((o1 - open_days(snap, bookings(snap), *W)) * 10) / 10
        moves.append(best)
    after = open_days(snap, bookings(snap), *W)
    return OptimizerResult(win=tuple(W), moves=moves, skipped=skipped, before=before, after=after, lock=snap.lock,
                           opt_all=snap.opt_all, opt_margin=snap.opt_margin)
