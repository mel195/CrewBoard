"""Build step 5: Plan all, optimizer, Riley. Each test gets its own demo workspace so results match the golden fixtures."""
from __future__ import annotations

import json
import pathlib
import uuid
from datetime import date, timedelta

from sqlalchemy import text

from app.core.db import sessionmaker

from .conftest import As, make_demo

GOLD = pathlib.Path(__file__).parents[1] / "golden" / "fixtures"
ANCHOR = date(2026, 10, 26)


def gold(name):
    return json.loads((GOLD / f"{name}.json").read_text())


def names(g):
    return {c["id"]: c["name"] for c in g["inputs"]["CREWS"]}, {k: v["title"] for k, v in g["inputs"]["JOBS"].items()}


def day(i):
    return (ANCHOR + timedelta(days=i)).isoformat()


def key():
    return {"Idempotency-Key": str(uuid.uuid4())}


async def fresh(client, tag) -> As:
    return await make_demo(client, f"{tag}-{uuid.uuid4().hex[:6]}@ppp.example", f"{tag} (demo)")


def expected_moves(g):
    crew, job = names(g)
    return [(job[m["jid"]], crew[m["crew"]], day(m["s"]), day(m["e"]), m["score"], (m["shift"] or {}).get("name"), (m["shift"] or {}).get("k"),
             [crew[a["crew"]] for a in m["alts"]]) for m in g["outputs"]["optimize"]["moves"]]


def got_moves(run):
    return [(m["job_title"], m["crew_name"], m["start"], m["end"], m["score"], (m["shift"] or {}).get("name"), (m["shift"] or {}).get("days"),
             [a["crew_name"] for a in m["alternatives"]]) for m in run["moves"]]


async def test_plan_all_matches_prototype_and_confirms(client):
    t = await fresh(client, "planall")
    g = gold("base")
    crew, job = names(g)
    r = await t.post("/plan-all")
    assert r.status_code == 201
    run = r.json()
    assert [(i["job_title"], i["crew_name"], i["start"], i["end"], i["score"]) for i in run["items"]] == \
           [(job[i["jid"]], crew[i["crew"]], day(i["s"]), day(i["e"]), i["score"]) for i in g["outputs"]["planAll"]["items"]]
    q = (await t.get("/queue")).json()
    assert all(i["placement_status"] == "draft" for i in q["items"])
    c = await t.post(f"/plan-all/{run['id']}/confirm", json={}, headers=key())
    assert c.status_code == 200 and c.json()["status"] == "confirmed" and c.json()["message_batches"] == []
    q = (await t.get("/queue")).json()
    assert all(i["placement_status"] == "scheduled" for i in q["items"])
    assert (await t.post(f"/plan-all/{run['id']}/confirm", json={}, headers=key())).json()["code"] == "plan_closed"
    riley = (await t.get("/assistant")).json()
    assert riley["observed"] == 46 + 4


async def test_plan_all_goes_stale(client):
    t = await fresh(client, "stale")
    run = (await t.post("/plan-all")).json()
    pid = run["items"][0]["placement_id"]
    p = (await t.get(f"/placements/{pid}")).json()
    await t.patch(f"/placements/{pid}", json={"start": p["visits"][0]["start"]}, headers={"If-Match": f'"{p["version"]}"'})
    r = await t.post(f"/plan-all/{run['id']}/confirm", json={}, headers=key())
    assert r.status_code == 409 and r.json()["code"] == "plan_stale"


async def test_optimizer_matches_prototype(client):
    t = await fresh(client, "opt")
    for scen, body in [("base", {}), ("margin_4w", {"range": "4w", "weigh_margin": True}), ("all_crews", {"include_all_crews": True})]:
        g = gold(scen)
        r = await t.post("/optimizer-runs", json=body)
        assert r.status_code == 201, r.text
        run = r.json()
        assert got_moves(run) == expected_moves(g), scen
        assert (run["open_days_before"], run["open_days_after"]) == (g["outputs"]["optimize"]["before"], g["outputs"]["optimize"]["after"]), scen
    csv = await t.get(f"/optimizer-runs/{run['id']}/csv")
    assert csv.status_code == 200 and csv.text.startswith("Job,Crew,Start")


async def test_optimizer_shift_rerun_and_apply(client):
    t = await fresh(client, "shift")
    rules = await t.get("/settings/rules")
    body = {k: v for k, v in rules.json().items() if k != "version"}
    await t.put("/settings/rules", json={**body, "min_reviews": 1, "region_rule": False, "weather_rule": False, "lead_rule": False},
                headers={"If-Match": rules.headers["ETag"]})
    g = gold("rules_relaxed")
    run = (await t.post("/optimizer-runs", json={})).json()
    assert got_moves(run) == expected_moves(g)
    shifted = next(m for m in run["moves"] if m["shift"])
    # Reject a move: it becomes a rule for the next run
    other = next(m for m in run["moves"] if not m["shift"])
    rr = await t.post(f"/optimizer-runs/{run['id']}/rerun", json={"moves": [{"seq": other["seq"], "keep": False, "reason_key": "crew"}]})
    assert rr.status_code == 201, rr.text
    run2 = rr.json()
    assert run2["constraints"]["reject"] == {str(other["job_id"]): [str(other["crew_id"])]}
    assert not any(m["job_id"] == other["job_id"] and m["crew_id"] == other["crew_id"] for m in run2["moves"])
    assert any(m["kept_from_previous_run"] for m in run2["moves"])
    assert (await t.get(f"/optimizer-runs/{run['id']}")).json()["status"] == "superseded"
    # Apply: drafts marked optimizer, the confirmed job moves with a decision and a message
    cal_before = (await t.get("/calendar")).json()
    fixed_before = next(b for b in cal_before["bookings"] if b["placement_id"] == shifted["shift"]["placement_id"])
    ap = await t.post(f"/optimizer-runs/{run2['id']}/apply", json={}, headers=key())
    assert ap.status_code == 200, ap.text
    out = ap.json()
    assert out["run"]["status"] == "applied" and len(out["placement_ids"]) == len(run2["moves"])
    if any(m["shift"] for m in run2["moves"]):
        cal = (await t.get("/calendar")).json()
        fixed_after = next(b for b in cal["bookings"] if b["placement_id"] == shifted["shift"]["placement_id"])
        assert date.fromisoformat(fixed_after["start"]) - date.fromisoformat(fixed_before["start"]) == timedelta(days=shifted["shift"]["days"])
        assert out["message_batch"]["trigger"] == "move" and "rescheduled" in out["message_batch"]["messages"][0]["body"]
    p = (await t.get(f"/placements/{out['placement_ids'][0]}")).json()
    assert p["recommended_by"] == "optimizer"
    # Optimizer picks confirm without a reason, even when not the top-ranked crew
    for pid in out["placement_ids"]:
        p = (await t.get(f"/placements/{pid}")).json()
        c = await t.post(f"/placements/{pid}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', **key()})
        assert c.status_code == 200, c.text
    # Applying an old run after the schedule changed is refused
    r3 = (await t.post("/optimizer-runs", json={"range": "4w"})).json()
    some = (await t.get("/queue")).json()["items"][0]
    cal = (await t.get("/calendar")).json()
    pid = next(b["placement_id"] for b in cal["bookings"] if b["job_id"] == some["job_id"])
    p = (await t.get(f"/placements/{pid}")).json()
    await t.post(f"/placements/{pid}/unschedule", headers={"If-Match": f'"{p["version"]}"', **key()})
    assert (await t.post(f"/optimizer-runs/{r3['id']}/apply", json={}, headers=key())).json()["code"] == "plan_stale"


async def test_riley(client):
    t = await fresh(client, "riley")
    s = (await t.get("/assistant")).json()
    assert (s["stage"], s["observed"], s["agreed"], s["agreement_pct"]) == (0, 46, 34, 74)
    assert s["by_job_type"]["exterior"] == {"observed": 18, "agreed": 15}
    q = (await t.get("/queue")).json()
    J = {i["title"].split(" ")[0].lower(): i for i in q["items"]}
    pick = next(p for p in s["picks"] if p["job_id"] == J["hernandez"]["job_id"])
    assert pick["pattern"] is True and pick["crew_name"] == "Gian"
    detail = (await t.get(f"/jobs/{J['hernandez']['job_id']}/assistant-pick")).json()
    assert detail["pick"]["crew_name"] == "Gian" and detail["runner_up"] is None   # only Gian passes for Hernandez
    # Stage 2 books jobs under $2,500 on its own (Okafor is $2,400), no messages
    r = await t.put("/assistant/stage", json={"stage": 2})
    assert r.status_code == 200 and r.json()["booked"] == [J["okafor"]["job_id"]]
    q = (await t.get("/queue")).json()
    assert next(i for i in q["items"] if i["job_id"] == J["okafor"]["job_id"])["placement_status"] == "scheduled"
    assert (await t.post(f"/assistant/bookings/{J['hernandez']['job_id']}/undo")).status_code == 422
    assert (await t.post(f"/assistant/bookings/{J['okafor']['job_id']}/undo")).status_code == 204
    await t.put("/assistant/stage", json={"stage": 2})   # no change, nothing booked again
    await t.put("/assistant/stage", json={"stage": 0})
    r = await t.put("/assistant/stage", json={"stage": 2})
    assert r.json()["booked"] == [J["okafor"]["job_id"]]
    r = await t.put("/assistant/stage", json={"stage": 1})
    assert r.json()["removed"] == [J["okafor"]["job_id"]]
    # Habits: keep one with a condition; answers can add habits
    hs = (await t.get("/assistant/habits")).json()
    new = next(h for h in hs if h["status"] == "new")
    assert (await t.patch(f"/assistant/habits/{new['id']}", json={"condition": {"bad": 1}})).status_code == 422
    h = await t.patch(f"/assistant/habits/{new['id']}", json={"status": "kept", "condition": {"job_type": "interior", "skills_any": ["drywall"]}})
    assert h.status_code == 200 and h.json()["status"] == "kept"
    qs = (await t.get("/assistant/questions")).json()
    a = await t.post(f"/assistant/questions/{qs[0]['id']}/answer", json={"answer": "Yes, make it a habit"})
    assert a.status_code == 200
    assert any(x["text"].startswith("From your answer: Yes, make it a habit") for x in (await t.get("/assistant/habits")).json())
    # Accepting Riley's pick (a kept habit) confirms without a reason
    p = (await t.post(f"/jobs/{J['hernandez']['job_id']}/assistant-pick/accept")).json()
    assert p["recommended_by"] == "riley"
    c = await t.post(f"/placements/{p['id']}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert c.status_code == 200 and c.json()["riley_agreed"] is True
    # Learners: switching a scheduler off keeps their decisions out of training
    me = (await t.get("/me")).json()
    mid = me["memberships"][0]["id"]
    assert (await t.put(f"/assistant/learners/{mid}", json={"enabled": False})).status_code == 204
    p = (await t.post(f"/jobs/{J['patel']['job_id']}/placement", json={})).json()
    await t.post(f"/placements/{p['id']}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', **key()})
    log = (await t.get("/assistant/log")).json()
    assert [r["used_in_training"] for r in log][:2] == [False, True]
    assert (await t.get("/assistant/log/csv")).text.startswith("When,Scheduler,Job")
    assert (await t.post("/assistant/refresh")).status_code == 204
    assert (await t.get("/assistant")).json()["last_refreshed_at"]


async def test_riley_admin_only(client, ido):
    r = await ido.post("/members", json={"email": "s2@ppp.example", "display_name": "Sam S.", "role": "scheduler"})
    sched = As(client, "s2@ppp.example", ido.tenant_id)
    assert (await sched.put("/assistant/stage", json={"stage": 1})).status_code == 403
    qs = (await sched.get("/assistant/questions")).json()
    admin_q = next(q for q in qs if q["audience"] == "admin")
    assert (await sched.post(f"/assistant/questions/{admin_q['id']}/answer", json={"answer": admin_q["options"][0]})).status_code == 403
