"""Build step 6: usage and feedback, workspace export and import, integrations."""
from __future__ import annotations

import io
import json
import os
import time
import uuid

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.integrations.service import sign

from .conftest import As, make_demo


async def fresh(client, tag) -> As:
    return await make_demo(client, f"{tag}-{uuid.uuid4().hex[:6]}@ppp.example", f"{tag} (demo)")


def blank_tenant(email: str) -> str:
    """A real (non-demo) workspace with no data, created the way onboarding will."""
    eng = create_engine(get_settings().migration_database_url)
    tid, uid = uuid.uuid4(), uuid.uuid4()
    with eng.begin() as c:
        c.execute(text("insert into platform.tenant (id, name, time_zone, currency, default_language, trades, status, is_demo) "
                       "values (:t, 'Blank Co', 'America/New_York', 'USD', 'en', '{painting}', 'trial', false)"), {"t": tid})
        c.execute(text("insert into platform.app_user (id, email, display_name) values (:u, :e, 'Blank Owner')"), {"u": uid, "e": email})
        c.execute(text("insert into platform.membership (id, tenant_id, user_id, role, display_name, status) "
                       "values (gen_random_uuid(), :t, :u, 'owner', 'Blank Owner', 'active')"), {"t": tid, "u": uid})
    eng.dispose()
    return str(tid)


async def test_usage_needs_consent_and_reports(client):
    t = await fresh(client, "usage")
    sid = str(uuid.uuid4())
    ev = {"session_id": sid, "role_view": {"scheduler": 40}, "events": [{"kind": "page_time", "page": "queue", "seconds": 40},
                                                                         {"kind": "feature", "feature": "confirm", "count": 2}]}
    r = await t.post("/usage/events", json=ev)
    assert r.status_code == 403 and r.json()["code"] == "consent_required"
    assert (await t.put("/me/telemetry-consent", json={"consent": True})).json() == {"consent": True}
    assert (await t.post("/usage/events", json=ev)).status_code == 204
    assert (await t.post("/usage/events", json={**ev, "events": [{"kind": "page_time", "page": "cal", "seconds": 20}]})).status_code == 204
    # names that could carry client details are refused
    bad = await t.post("/usage/events", json={**ev, "events": [{"kind": "feature", "feature": "Rosa Hernandez (305) 555"}]})
    assert bad.status_code == 422
    fb = await t.post("/feedback", json={"page": "queue", "anchor": "card:hernandez", "context": {"job": "Hernandez"}, "kind": "confusing",
                                         "text": "Not sure what the green chip means"})
    assert fb.status_code == 201 and fb.json()["status"] == "open"
    assert (await t.post("/feedback", json={"page": "queue", "text": "   "})).status_code == 422
    # The owner's own sessions are hidden by default, like the prototype
    u = (await t.get("/usage")).json()
    assert u["sessions"] == [] and u["feedback"] == []
    u = (await t.get("/usage?include_owners=true")).json()
    assert u["people"] == 1 and u["total_seconds"] == 60
    assert u["time_per_page"] == [{"page": "queue", "seconds": 40}, {"page": "cal", "seconds": 20}]
    assert u["features"] == [{"feature": "confirm", "count": 2}] and u["time_by_role_view"] == {"scheduler": 80}
    assert u["feedback"][0]["text"] == "Not sure what the green chip means"
    done = await t.patch(f"/feedback/{fb.json()['id']}", json={"status": "done"})
    assert done.json()["status"] == "done"
    # Only the owner sees usage
    await t.post("/members", json={"email": f"adm-{sid[:6]}@ppp.example", "display_name": "Ada", "role": "admin"})
    adm = As(client, f"adm-{sid[:6]}@ppp.example", t.tenant_id)
    assert (await adm.get("/usage")).status_code == 403
    assert (await adm.patch(f"/feedback/{fb.json()['id']}", json={"status": "open"})).status_code == 403


async def _fingerprint(t: As):
    q = (await t.get("/queue")).json()
    out = []
    for i in q["items"]:
        rk = (await t.get(f"/jobs/{i['job_id']}/ranking")).json()
        out.append((i["title"], [(r["crew_name"], r["score"], r["ok"]) for r in rk["rows"][:5]], rk["riley_pick"]["crew_name"] if rk["riley_pick"] else None))
    cal = (await t.get("/calendar")).json()
    return out, sorted((b["title"] if "title" in b else b.get("job_title"), b["start"], b["end"]) for b in cal["bookings"])


async def test_export_import_round_trip(client):
    a = await fresh(client, "expA")
    # change something so the export isn't just the seed
    q = (await a.get("/queue")).json()["items"]
    p = (await a.post(f"/jobs/{q[0]['job_id']}/placement", json={})).json()
    await a.post(f"/placements/{p['id']}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', "Idempotency-Key": str(uuid.uuid4())})
    await a.post("/optimizer-runs", json={})
    r = await a.get("/workspace/export")
    assert r.status_code == 200 and r.headers["content-disposition"].startswith('attachment; filename="crewboard-expa-')
    data = r.json()
    assert data["app"] == "crewboard-api" and data["format"] == 1
    assert "platform.membership" not in data["tables"] and "insight.usage_event" not in data["tables"]
    assert len(data["tables"]["ops.crew"]) == 21 and len(data["tables"]["ops.optimizer_run"]) == 1

    # Into another demo workspace: its data is replaced, and it schedules exactly the same
    b = await fresh(client, "expB")
    await b.post("/plan-all")      # make B different first
    up = await b.post("/workspace/import", files={"file": ("backup.json", io.BytesIO(r.content), "application/json")})
    assert up.status_code == 200, up.text
    assert up.json()["replaced_demo_data"] is True and up.json()["tables"]["ops.crew"] == 21
    assert await _fingerprint(b) == await _fingerprint(a)
    ids_a = {c["id"] for c in data["tables"]["ops.crew"]}
    ids_b = {c["id"] for c in (await b.get("/crews")).json()}
    assert ids_a.isdisjoint(ids_b) and len(ids_b) == 21           # new ids
    assert (await b.get(f"/jobs/{q[0]['job_id']}")).status_code == 404   # old job ids don't exist in B
    log = (await b.get("/audit-events?type=Import")).json()["items"]
    assert log and log[0]["text"].startswith("Imported workspace data from a backup file")

    # Into an empty real workspace, then refused once it has data
    email = f"blank-{uuid.uuid4().hex[:6]}@co.example"
    c = As(client, email, blank_tenant(email))
    up = await c.post("/workspace/import", files={"file": ("backup.json", io.BytesIO(r.content), "application/json")})
    assert up.status_code == 200, up.text and up.json()["replaced_demo_data"] is False
    assert len((await c.get("/crews")).json()) == 21
    again = await c.post("/workspace/import", files={"file": ("backup.json", io.BytesIO(r.content), "application/json")})
    assert again.status_code == 409 and again.json()["code"] == "workspace_not_empty"
    bad = await c.post("/workspace/import", files={"file": ("x.json", io.BytesIO(b'{"app": "other"}'), "application/json")})
    assert bad.json()["code"] == "not_a_backup"
    # Only owners export
    await a.post("/members", json={"email": f"s-{email}", "display_name": "Sam", "role": "admin"})
    assert (await As(client, f"s-{email}", a.tenant_id).get("/workspace/export")).status_code == 403


async def test_integrations_webhook_crm_and_worker(client):
    t = await fresh(client, "integ")
    lst = (await t.get("/integrations")).json()
    assert {c["provider"]: c["status"] for c in lst}["paintscout"] == "stub"
    os.environ["CREWBOARD_SECRET_PS_WEBHOOK"] = "s3cret"
    put = await t.put("/integrations/paintscout", json={"secret_ref": "ps-webhook"})
    assert put.json()["has_secret"] is True
    body = json.dumps({"event": "estimate.sold", "estimate_id": "PS-1042"}).encode()
    ts = str(int(time.time()))
    hdr = {"X-Tenant-Id": t.tenant_id, "X-Crewboard-Timestamp": ts, "Content-Type": "application/json"}
    ok = await client.post("/api/v1/integrations/paintscout/webhook", content=body, headers={**hdr, "X-Crewboard-Signature": sign("s3cret", ts, body)})
    assert ok.status_code == 202 and ok.json()["status"] == "stored"
    bad = await client.post("/api/v1/integrations/paintscout/webhook", content=body, headers={**hdr, "X-Crewboard-Signature": "sha256=00"})
    assert bad.status_code == 401 and bad.json()["code"] == "bad_signature"
    old = str(int(time.time()) - 3600)
    stale = await client.post("/api/v1/integrations/paintscout/webhook", content=body,
                              headers={**hdr, "X-Crewboard-Timestamp": old, "X-Crewboard-Signature": sign("s3cret", old, body)})
    assert stale.status_code == 401
    nosecret = await client.post("/api/v1/integrations/salesforce/webhook", content=body, headers={**hdr, "X-Crewboard-Signature": sign("s3cret", ts, body)})
    assert nosecret.json()["code"] == "webhook_not_configured"
    # CRM account stub: same id on the second call
    cid = (await t.get("/clients")).json()[0]["id"]
    one = (await t.post(f"/clients/{cid}/crm-account")).json()
    two = (await t.post(f"/clients/{cid}/crm-account")).json()
    assert one["created"] is True and two["created"] is False and one["external_id"] == two["external_id"].upper()
    # The worker drains both jobs (the webhook and the CRM call)
    from app.worker import drain, worker_url
    eng = create_async_engine(worker_url())
    try:
        n = await drain(async_sessionmaker(eng, expire_on_commit=False))
    finally:
        await eng.dispose()
    assert n >= 2
    sync = create_engine(get_settings().migration_database_url)
    with sync.begin() as c:
        rows = c.execute(text("select kind, status from system.outbox_job where tenant_id = :t order by kind"), {"t": t.tenant_id}).all()
    sync.dispose()
    assert [tuple(r) for r in rows] == [("salesforce.create_account", "done"), ("webhook.paintscout", "done")]


def test_every_tenant_table_has_row_level_security(client):
    """Every table with tenant_id, including the step 6 ones, is behind the tenant policy."""
    from app.models import TENANT_TABLES
    eng = create_engine(get_settings().migration_database_url)
    with eng.begin() as c:
        rls = {f"{r[0]}.{r[1]}" for r in c.execute(text(
            "select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace "
            "join pg_policy p on p.polrelid = c.oid where c.relrowsecurity and p.polname = 'tenant_isolation'"))}
    eng.dispose()
    assert set(TENANT_TABLES) - rls == set()
