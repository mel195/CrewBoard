from __future__ import annotations

import json
import pathlib
from datetime import date, timedelta

from sqlalchemy import text

from app.core.db import sessionmaker

from .conftest import As

BASE = json.loads((pathlib.Path(__file__).parents[1] / "golden" / "fixtures" / "base.json").read_text())
CREW_NAME = {c["id"]: c["name"] for c in BASE["inputs"]["CREWS"]}
ANCHOR = date.fromisoformat(BASE["inputs"]["DL"][0]["iso"])
JOB_TITLE = {k: v["title"] for k, v in BASE["inputs"]["JOBS"].items()}


async def test_me_and_demo(ido: As):
    r = await ido.get("/me")
    assert r.status_code == 200
    me = r.json()
    assert me["role"] == "owner" and me["memberships"][0]["tenant_name"] == "PPP (demo)"


async def test_queue_and_ranking_match_prototype(ido: As):
    """The seeded demo tenant, loaded from the database, ranks exactly like the prototype (golden base scenario)."""
    q = (await ido.get("/queue")).json()
    assert q["today"] == ANCHOR.isoformat()
    assert [i["title"] for i in q["items"]] == [JOB_TITLE[j] for j in BASE["inputs"]["QORDER"]]
    k = BASE["outputs"]["kpiSched"]
    assert (q["kpis"]["booked_pct"], q["kpis"]["booked_crew_days"], q["kpis"]["capacity_crew_days"]) == (k["pct"], k["pd"], k["cap"])
    assert (q["kpis"]["jobs_on_calendar"], q["kpis"]["value_on_calendar"]) == (k["jobs"], k["val"])
    assert q["kpis"]["open_crew_days"] == BASE["outputs"]["openDays"]
    for item, jid in zip(q["items"], BASE["inputs"]["QORDER"]):
        exp = BASE["outputs"]["jobs"][jid]
        r = (await ido.get(f"/jobs/{item['job_id']}/ranking")).json()
        assert r["label"] == exp["label"]
        assert [x["crew_name"] for x in r["rows"]] == [CREW_NAME[x["crew"]] for x in exp["rank"]]
        for got, e in zip(r["rows"], exp["rank"]):
            assert got["score"] == e["score"] and got["ok"] == e["ok"], (jid, got["crew_name"])
            assert [f["message"] for f in got["failures"]] == e["fails"]
            if e["slot"]:
                assert got["slot"]["start"] == (ANCHOR + timedelta(days=e["slot"]["s"])).isoformat()
                assert got["slot"]["end"] == (ANCHOR + timedelta(days=e["slot"]["e"])).isoformat()
        for got, e in zip(r["rows"], exp["why"]):
            assert got["why"] == e["plus"] and got["weakness"] == e["minus"]
        assert r["riley_pick"]["crew_name"] == CREW_NAME[exp["rileyPick"]["crew"]]
        assert r["riley_pick"]["why"] == exp["rileyPick"]["why"]


async def test_tenant_isolation(ido: As, other: As, client):
    mine = (await ido.get("/crews")).json()
    theirs = (await other.get("/crews")).json()
    assert {c["id"] for c in mine}.isdisjoint({c["id"] for c in theirs})
    # Another tenant's id looks like it doesn't exist
    r = await ido.get(f"/crews/{theirs[0]['id']}")
    assert r.status_code == 404
    # Picking a tenant you don't belong to
    r = await As(client, ido.email, other.tenant_id).get("/crews")
    assert r.status_code == 404
    # Row-level security as the app role: with tenant A set, B's rows are invisible even without a filter
    async with sessionmaker()() as s:
        async with s.begin():
            await s.execute(text("select set_config('app.tenant_id', :t, true)"), {"t": ido.tenant_id})
            n = (await s.execute(text("select count(*) from ops.crew where tenant_id = :o"), {"o": other.tenant_id})).scalar()
            assert n == 0
            total = (await s.execute(text("select count(distinct tenant_id) from ops.crew"))).scalar()
            assert total == 1


async def test_roles(ido: As, client):
    r = await ido.post("/members", json={"email": "carla@ppp.example", "display_name": "Carla M.", "role": "scheduler"})
    assert r.status_code == 201, r.text
    carla = As(client, "carla@ppp.example", ido.tenant_id)
    assert (await carla.get("/queue")).status_code == 200
    rules = await carla.get("/settings/rules")
    r = await carla.put("/settings/rules", json={k: v for k, v in rules.json().items() if k != "version"}, headers={"If-Match": rules.headers["ETag"]})
    assert r.status_code == 403 and r.json()["code"] == "forbidden"
    assert (await carla.post("/members", json={"email": "x@y.example", "display_name": "X", "role": "admin"})).status_code == 403


async def test_rules_concurrency_validation_and_audit(ido: As):
    r = await ido.get("/settings/rules")
    body = {k: v for k, v in r.json().items() if k != "version"}
    etag = r.headers["ETag"]
    assert (await ido.put("/settings/rules", json=body)).status_code == 428
    bad = await ido.put("/settings/rules", json={**body, "max_drive_min": 200}, headers={"If-Match": etag})
    assert bad.status_code == 422 and bad.json()["code"] == "validation_failed"
    ok = await ido.put("/settings/rules", json={**body, "max_drive_min": 50}, headers={"If-Match": etag})
    assert ok.status_code == 200 and ok.json()["max_drive_min"] == 50
    stale = await ido.put("/settings/rules", json={**body, "max_drive_min": 40}, headers={"If-Match": etag})
    assert stale.status_code == 409 and stale.json()["code"] == "version_conflict"
    # put it back for other tests
    cur = await ido.get("/settings/rules")
    await ido.put("/settings/rules", json={**body, "max_drive_min": 45}, headers={"If-Match": cur.headers["ETag"]})
    # audit event written, and the app role can't rewrite history
    async with sessionmaker()() as s:
        async with s.begin():
            await s.execute(text("select set_config('app.tenant_id', :t, true)"), {"t": ido.tenant_id})
            n = (await s.execute(text("select count(*) from audit.audit_event where type='Setting' and text like 'Changed scheduling rules%'"))).scalar()
            assert n >= 2
    async with sessionmaker()() as s:
        try:
            async with s.begin():
                await s.execute(text("select set_config('app.tenant_id', :t, true)"), {"t": ido.tenant_id})
                await s.execute(text("update audit.audit_event set text='x'"))
            raise AssertionError("audit update should be refused")
        except Exception as e:  # permission denied
            assert "permission denied" in str(e)


async def test_admin_rating_counts_right_away(ido: As):
    """BL-17: a rating entered by an admin bypasses the review minimum."""
    q = (await ido.get("/queue")).json()
    for item in q["items"]:
        r = (await ido.get(f"/jobs/{item['job_id']}/ranking")).json()
        row = next((x for x in r["rows"] if any(f["code"] == "few_reviews" for f in x["failures"])), None)
        if row:
            break
    assert row, "expected a crew failing on review count in the sample data"
    job = await ido.get(f"/jobs/{item['job_id']}")
    jt = job.json()["job_type"]
    crew = (await ido.get(f"/crews/{row['crew_id']}")).json()
    val = next(x["value"] for x in crew["ratings"] if x["dimension"] == jt)
    assert (await ido.put(f"/crews/{row['crew_id']}/ratings/{jt}", json={"value": val})).status_code == 200
    r2 = (await ido.get(f"/jobs/{item['job_id']}/ranking")).json()
    row2 = next(x for x in r2["rows"] if x["crew_id"] == row["crew_id"])
    assert not any(f["code"] == "few_reviews" for f in row2["failures"])


async def test_label_choice_and_problem_format(ido: As):
    q = (await ido.get("/queue")).json()
    jid = q["items"][1]["job_id"]
    r = await ido.put(f"/jobs/{jid}/ranking-settings", json={"label": "Fastest start"})
    assert r.status_code == 200 and r.json()["label"] == "Fastest start"
    nf = await ido.get("/crews/00000000-0000-0000-0000-000000000000")
    assert nf.status_code == 404 and nf.headers["content-type"].startswith("application/problem+json") and nf.json()["code"] == "not_found"
    labels = (await ido.get("/ranking-labels")).json()
    assert [l["name"] for l in labels][:4] == ["Balanced", "Protect margin", "Fastest start", "White glove"]


async def test_crew_create_patch_clients(ido: As):
    areas = (await ido.get("/service-areas")).json()
    r = await ido.post("/crews", json={"name": "New Crew", "size_min": 2, "base_area_id": areas[0]["id"]})
    assert r.status_code == 201 and r.json()["missing"] == ["region", "jobRating"]
    cid = r.json()["id"]
    p = await ido.patch(f"/crews/{cid}", json={"status": "inactive"}, headers={"If-Match": f'"{r.json()["version"]}"'})
    assert p.status_code == 200 and p.json()["status"] == "inactive" and p.json()["version"] == 2
    assert (await ido.post("/crews", json={"name": "new crew"})).json()["code"] == "name_taken"
    c = await ido.post("/clients", json={"name": "Maria Lopez", "language": "es"})
    assert c.status_code == 201 and c.json()["first_name"] == "Maria"
    f = await ido.post(f"/clients/{c.json()['id']}/follow-ups", json={"due_date": "2026-11-20"})
    assert f.status_code == 201
    assert len((await ido.get("/clients", params={"q": "lopez"})).json()) == 1
