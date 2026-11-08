"""Golden parity tests: the Python engine must reproduce the prototype's outputs exactly.

Fixtures come from tests/golden/capture/capture.py, run against the prototype (index.html at the repo root).
"""
from __future__ import annotations

import json
import pathlib
from dataclasses import asdict

import pytest

from app.assistant.engine import habit_matches, riley_pick
from app.optimizer.engine import crew_pay, margin, optimize
from app.scheduling.engine.core import (bookings, day_cap, earliest_slot, need, place_conf, place_days, span)
from app.scheduling.engine.planning import kpi_sched, kpi_waiting, open_days, plan_all
from app.scheduling.engine.prototype import snapshot_from_prototype
from app.scheduling.engine.ranking import drive_min, imp, imp_why, label_for, missing, rank, ready, weights, why_lines

FIXTURES = sorted((pathlib.Path(__file__).parent / "fixtures").glob("*.json"))


def load(path):
    data = json.loads(path.read_text())
    return snapshot_from_prototype(data["inputs"]), data["inputs"], data["outputs"]


def span_dict(sp):
    if sp is None:
        return None
    return {"s": sp.s, "e": sp.e, "holds": sp.holds, "conf": sp.conf, "n": sp.n, "half": sp.half}


def approx(a, b):
    return a == pytest.approx(b, abs=1e-9)


@pytest.fixture(params=FIXTURES, ids=[p.stem for p in FIXTURES])
def scenario(request):
    return load(request.param)


def test_habit_conditions_match_prototype_tests(scenario):
    snap, inputs, _ = scenario
    for h, raw in zip(snap.habits, inputs["learned"]):
        for jid, expected in raw["matches"].items():
            assert habit_matches(h, snap.jobs[jid]) == expected, (h.id, jid)


def test_capacity_and_readiness(scenario):
    snap, _, out = scenario
    for cid, caps in out["dayCap"].items():
        assert [day_cap(snap, cid, d) for d in range(42)] == pytest.approx(caps), cid
    for c in snap.crews:
        assert ready(snap, c) == out["ready"][c.id]["ready"]
        assert missing(snap, c) == out["ready"][c.id]["missing"]


def test_bookings(scenario):
    snap, _, out = scenario
    got = [(b.id, b.crew, b.s, b.e, b.half, b.prop if not b.fixed else None) for b in bookings(snap)]
    exp = [(b["id"], b["crew"], b["s"], b["e"], b.get("half"), b.get("prop") if not b.get("fixed") else None) for b in out["bookings"]]
    assert got == exp


def test_per_job(scenario):
    snap, _, out = scenario
    for jid, o in out["jobs"].items():
        job = snap.jobs[jid]
        assert label_for(snap, jid) == o["label"]
        assert weights(snap, jid) == o["weights"]
        assert imp(snap, job) == o["imp"]
        assert imp_why(snap, job) == o["impWhy"]
        B = bookings(snap, jid)
        for cid, n in o["need"].items():
            nd = need(snap, job, cid)
            assert {"n": nd.n, "half": nd.half} == n
        for cid, exp in o["earliest"].items():
            assert span_dict(earliest_slot(snap, job, cid, B)) == exp, (jid, cid)
        for sp in o["spans"]:
            assert span_dict(span(snap, job, sp["crew"], sp["start"], B, sp["extra"])) == sp["span"], (jid, sp["crew"], sp["start"])
        for cid, dm in o["driveMin"].items():
            assert drive_min(snap, snap.crew(cid).base, job.area) == dm
        for cid, m in o["margin"].items():
            assert margin(snap, jid, cid) == m
            cp = crew_pay(snap, job, cid)
            assert (cp["amt"], cp["rate"]) == (o["crewPay"][cid]["amt"], o["crewPay"][cid]["rate"])


def test_rank(scenario):
    snap, _, out = scenario
    for jid, o in out["jobs"].items():
        rows = rank(snap, jid)
        assert [r.crew for r in rows] == [r["crew"] for r in o["rank"]], jid
        for got, exp in zip(rows, o["rank"]):
            assert got.ok == exp["ok"], (jid, got.crew)
            assert [f.message for f in got.fails] == exp["fails"], (jid, got.crew)
            assert span_dict(got.slot) == exp["slot"], (jid, got.crew)
            assert got.f == pytest.approx(exp["f"]), (jid, got.crew)
            assert got.score == exp["score"], (jid, got.crew)
            assert got.needs_rating == exp["needsRating"]
        for got, exp in zip(rows, o["why"]):
            assert why_lines(snap, snap.jobs[jid], got) == exp, (jid, got.crew)


def test_riley_pick(scenario):
    snap, _, out = scenario
    for jid, o in out["jobs"].items():
        assert riley_pick(snap, jid) == o["rileyPick"], jid


def test_placements(scenario):
    snap, _, out = scenario
    for jid, o in out["jobs"].items():
        if "placement" in o:
            p = snap.place[jid]
            assert p.segs == o["placement"]["place"]["segs"]
            assert place_days(snap, jid) == o["placement"]["days"]
            assert place_conf(snap, jid) == o["placement"]["conf"]


def test_kpis(scenario):
    snap, _, out = scenario
    assert kpi_sched(snap) == out["kpiSched"]
    assert kpi_waiting(snap) == out["kpiWaiting"]
    assert approx(open_days(snap), out["openDays"])
    assert approx(open_days(snap, None, 0, 27), out["openDays4w"])


def test_plan_all(scenario):
    snap, _, out = scenario
    s2 = snap.copy()
    res = plan_all(s2)
    assert res.items == out["planAll"]["items"]
    assert res.skipped == out["planAll"]["skipped"]
    assert {k: v.segs for k, v in s2.place.items()} == {k: v["segs"] for k, v in out["planAll"]["place"].items()}


def test_optimizer(scenario):
    snap, _, out = scenario
    exp = out["optimize"]
    res = optimize(snap)
    assert approx(res.before, exp["before"]) and approx(res.after, exp["after"])
    assert res.skipped == exp["skipped"]
    assert len(res.moves) == len(exp["moves"])
    keys = ["jid", "crew", "s", "e", "half", "score", "fit", "shift", "mg", "notReady", "top", "topScore", "alts", "fill"]
    for got, e in zip(res.moves, exp["moves"]):
        for k in keys:
            assert got.get(k) == e.get(k), (got["jid"], k, got.get(k), e.get(k))
        assert approx(got["v"], e["v"])
    # optimizer never changes the snapshot it was given
    assert snap.place.keys() == load_place_keys(snap)


def load_place_keys(snap):
    return snap.place.keys()
