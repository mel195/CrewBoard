"""Build step 6: the design endpoints earlier steps left out."""
from __future__ import annotations

import csv
import io
import pathlib
import uuid

from .conftest import As, make_demo

SAMPLE_XLSX = pathlib.Path(__file__).parents[3] / "samples" / "crews-with-ratings.xlsx"


async def fresh(client, tag) -> As:
    return await make_demo(client, f"{tag}-{uuid.uuid4().hex[:6]}@ppp.example", f"{tag} (demo)")


def key():
    return {"Idempotency-Key": str(uuid.uuid4())}


async def scheduler(client, t: As) -> As:
    e = f"sch-{uuid.uuid4().hex[:6]}@ppp.example"
    await t.post("/members", json={"email": e, "display_name": "Carla", "role": "scheduler"})
    return As(client, e, t.tenant_id)


async def test_templates_and_client_message(client):
    t = await fresh(client, "tpl")
    ts = (await t.get("/templates")).json()
    assert [x["name"] for x in ts] == ["Estimate follow-up", "Colors and materials needed", "Send us your details", "Crew running late",
                                       "After the job: ask for a review"]
    assert set(ts[0]["texts"]) == {"en", "es", "ht", "pt"}
    bad = await t.post("/templates", json={"name": "Oops", "texts": {"en": "Hi {frist}"}})
    assert bad.status_code == 422 and bad.json()["code"] == "unknown_placeholder"
    new = await t.post("/templates", json={"name": "Gate code", "texts": {"en": "Hi {first}, what's the gate code for {job}?"}})
    assert new.status_code == 201
    tid = new.json()["id"]
    assert (await t.patch(f"/templates/{tid}", json={"name": "x"})).status_code == 428
    up = await t.patch(f"/templates/{tid}", json={"texts": {"es": "Hola {first}, ¿cuál es el código del portón?"}}, headers={"If-Match": '"1"'})
    assert up.status_code == 200 and set(up.json()["texts"]) == {"en", "es"} and up.json()["version"] == 2
    s = await scheduler(client, t)
    assert (await s.post("/templates", json={"name": "No", "texts": {"en": "x"}})).status_code == 403
    # Send from a template: placeholders filled in the client's language, logged at once
    clients = (await t.get("/clients?q=Hernandez")).json()
    cid = clients[0]["id"]
    h = key()
    m = await s.post(f"/clients/{cid}/messages", json={"template_id": ts[0]["id"]}, headers=h)
    assert m.status_code == 201, m.text
    body = m.json()
    assert body["status"] == "logged" and body["language"] == "es"
    assert body["body"].startswith("Hola Rosa, le escribe Precision Painting Plus.")
    again = await s.post(f"/clients/{cid}/messages", json={"template_id": ts[0]["id"]}, headers=h)
    assert again.json()["id"] == body["id"]
    typed = await s.post(f"/clients/{cid}/messages", json={"body": "See you Monday, {first}!", "language": "en", "channel": "email"}, headers=key())
    assert typed.json()["body"] == "See you Monday, Rosa!" and typed.json()["channel"] == "email"
    assert (await s.post(f"/clients/{cid}/messages", json={"body": "  "}, headers=key())).status_code == 422
    log = (await t.get("/messages")).json()
    assert any(x["body"] == "See you Monday, Rosa!" for x in (log["items"] if isinstance(log, dict) else log))
    assert (await t.delete(f"/templates/{tid}")).status_code == 204


async def test_views_fields_pm_dimensions_followups(client):
    t = await fresh(client, "set6")
    v = await t.post("/calendar-views", json={"name": "Miami crews", "config": {"view": "2w", "region": "Miami-Dade, FL"}})
    assert v.status_code == 201 and v.json()["shared"] is True
    s = await scheduler(client, t)
    mine = await s.post("/calendar-views", json={"name": "Just me", "config": {"view": "1w"}, "shared": False})
    assert mine.json()["shared"] is False
    assert {x["name"] for x in (await s.get("/calendar-views")).json()} == {"Miami crews", "Just me"}
    assert {x["name"] for x in (await t.get("/calendar-views")).json()} == {"Miami crews"}
    assert (await t.post("/calendar-views", json={"name": "miami CREWS", "config": {}})).json()["code"] == "name_taken"
    assert (await t.post("/calendar-views", json={"name": "x", "config": {"bogus": 1}})).status_code == 422
    assert (await t.delete(f"/calendar-views/{mine.json()['id']}")).status_code == 404
    assert (await s.delete(f"/calendar-views/{mine.json()['id']}")).status_code == 204

    f = {x["key"]: x["enabled"] for x in (await t.get("/settings/crew-fields")).json()}
    assert f["lead_safe"] is True and f["pay"] is False
    out = await t.put("/settings/crew-fields", json=[{"key": "lead_safe", "enabled": False}, {"key": "insurance", "enabled": True}])
    assert {x["key"]: x["enabled"] for x in out.json()}["insurance"] is True
    rules = (await t.get("/settings/rules")).json()
    assert rules["lead_rule"] is False
    assert (await s.put("/settings/crew-fields", json=[])).status_code == 403

    pm = (await t.get("/project-managers")).json()[0]
    up = await t.patch(f"/project-managers/{pm['id']}", json={"phone": "(305) 555-0199", "channel": "whatsapp"})
    assert up.json()["phone"] == "(305) 555-0199" and up.json()["channel"] == "whatsapp"
    dim = next(d for d in (await t.get("/rating-dimensions")).json() if d["key"] == "interior")
    assert (await t.patch(f"/rating-dimensions/{dim['id']}", json={"label": "Interior repaints"})).json()["label"] == "Interior repaints"

    cid = (await t.get("/clients")).json()[0]["id"]
    fu = (await t.post(f"/clients/{cid}/follow-ups", json={"due_date": "2026-11-02", "note": "Ask about colors"})).json()
    ed = await t.patch(f"/follow-ups/{fu['id']}", json={"due_date": "2026-11-04", "done": True})
    assert ed.json()["due_date"] == "2026-11-04" and ed.json()["done_at"]
    assert (await t.patch(f"/follow-ups/{fu['id']}", json={"done": False})).json()["done_at"] is None


async def test_crew_export_and_import(client):
    t = await fresh(client, "crewimp")
    csv_ = await t.get("/crews/export.csv")
    assert csv_.status_code == 200
    rows = list(csv.reader(io.StringIO(csv_.text)))
    assert rows[0][0] == "CREW" and rows[1][:3] == ["Crew", "Status", "Crew size"] and len(rows) == 2 + 21
    # The export imports back with no changes to names or ratings
    up = await t.post("/crew-imports", files={"file": ("crews.csv", io.BytesIO(csv_.content), "text/csv")})
    assert up.status_code == 201, up.text
    guess = {c["header"]: c["guess"] for c in up.json()["columns"]}
    assert guess["Crew"] == "name" and guess["Crew size"] == "size" and guess["Home base"] == "base"
    assert guess["Interior repaint"] == "r-job" if "Interior repaint" in guess else True
    res = await t.post(f"/crew-imports/{up.json()['id']}/commit", json={}, headers=key())
    assert res.status_code == 200, res.text
    assert (res.json()["created"], res.json()["updated"], res.json()["new_dimensions"]) == (0, 21, [])
    assert (await t.post(f"/crew-imports/{up.json()['id']}/commit", json={}, headers=key())).json()["code"] == "import_closed"
    again = list(csv.reader(io.StringIO((await t.get("/crews/export.csv")).text)))
    strip = lambda r: [x for i, x in enumerate(r) if i != 13]   # notes column picks up "Other info" columns
    assert [strip(r) for r in again] == [strip(r) for r in rows]

    # Ido's real sheet from the prototype: two sheets merged on crew name, rating groups from the row above the header
    up = await t.post("/crew-imports", files={"file": ("crews-with-ratings.xlsx", io.BytesIO(SAMPLE_XLSX.read_bytes()),
                                                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert up.status_code == 201, up.text
    j = up.json()
    assert [s["name"] for s in j["sheets"]] == ["Crew", "Crew Ratings"] and j["sheets"][1]["header_row"] == 3
    g = {(c["sheet"], c["header"]): c["guess"] for c in j["columns"]}
    assert g[("Crew", "Salesforce name")] == "sfName" and g[("Crew", "Google Calendar name")] == "gcal"
    assert g[("Crew Ratings", "Interior repaint")] == "r-job" and g[("Crew Ratings", "Drywall / skim")] == "r-skill"
    assert g[("Crew Ratings", "Client-facing")] == "r-attr" and g[("Crew Ratings", "Notes")] == "notes"
    res = (await t.post(f"/crew-imports/{j['id']}/commit", json={"mapping": [{"header": "Phone 2", "as": "ignore"}]}, headers=key())).json()
    assert res["created"] + res["updated"] == len(j["crews"]) and res["new_dimensions"] == []
    assert res["findings"][0]["text"].startswith("Merged 2 sheets on crew name")
    gian = next(c for c in (await t.get("/crews")).json() if c["name"] == "Gian")
    assert gian["phone"] == "7868653762" and {r["dimension"]: r["value"] for r in gian["ratings"]}["interior"] == 5
    assert {r["dimension"]: r["source"] for r in gian["ratings"]}["interior"] == "import"
    s = await scheduler(client, t)
    assert (await s.get("/crews/export.csv")).status_code == 403


async def test_pairings(client):
    t = await fresh(client, "pairs")
    gian = next(c for c in (await t.get("/crews")).json() if c["name"] == "Gian")
    p = (await t.get(f"/crews/{gian['id']}/pairings")).json()
    assert p["source"] == "sample"
    assert [(x["crew_name"], x["shared_jobs"]) for x in p["pairs"]] == [("Tania", 6), ("Rigo", 3), ("Wonder Painting", 2)]
    p = (await t.get(f"/crews/{gian['id']}/pairings?job_type=commercial")).json()
    assert [(x["crew_name"], x["shared_jobs"]) for x in p["pairs"]] == [("Tania", 4), ("Wonder Painting", 2)]


async def test_colors_and_color_form(client):
    t = await fresh(client, "colors")
    q = {i["title"].split(" ")[0].lower(): i for i in (await t.get("/queue")).json()["items"]}
    # Patel's colors aren't confirmed: text the color form
    patel = q["patel"]["job_id"]
    b = await t.post(f"/jobs/{patel}/color-form", headers=key())
    assert b.status_code == 200, b.text
    msg = b.json()["messages"][0]
    assert b.json()["trigger"] == "color_form" and msg["recipient_role"] == "client" and "/colors/" in msg["body"]
    assert (await t.get(f"/jobs/{patel}")).json()["colors_status"] == "sent"
    # Place and confirm it, then confirm the colors: crew lead and PM get a heads-up
    p = (await t.post(f"/jobs/{patel}/placement", json={})).json()
    pm = (await t.get("/project-managers")).json()[0]
    p = (await t.patch(f"/placements/{p['id']}", json={"pm_id": pm["id"]}, headers={"If-Match": f'"{p["version"]}"'})).json()
    await t.post(f"/placements/{p['id']}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', **key()})
    c = await t.put(f"/jobs/{patel}/colors", json={"colors": [{"surface": "Walls", "name": "Agreeable Gray", "hex": "#D1CBC1"}], "status": "confirmed"})
    assert c.status_code == 200, c.text
    out = c.json()
    assert out["status"] == "confirmed" and out["colors"][0]["name"] == "Agreeable Gray"
    roles = sorted(m["recipient_role"] for m in out["message_batch"]["messages"])
    assert roles == ["crew", "pm"]
    pm_msg = next(m for m in out["message_batch"]["messages"] if m["recipient_role"] == "pm")
    assert pm_msg["body"].startswith("Colors confirmed for Patel") and "Agreeable Gray" in pm_msg["body"]
    r = await t.post(f"/jobs/{patel}/color-form", headers=key())
    assert r.json().get("code") == "colors_confirmed", r.text
    ok = q["okafor"]["job_id"]
    assert (await t.put(f"/jobs/{ok}/colors", json={"colors": [], "status": "tbd"})).json()["colors"] == []
    assert (await t.put(f"/jobs/{ok}/colors", json={"status": "confirmed"})).json()["code"] == "no_colors"


async def test_explanation_weather_jobs_audit(client):
    t = await fresh(client, "explain")
    q = (await t.get("/queue")).json()
    jid = q["items"][0]["job_id"]
    rk = (await t.get(f"/jobs/{jid}/ranking")).json()
    e = (await t.get(f"/jobs/{jid}/ranking/explanation")).json()
    assert e["crew_id"] == rk["rows"][0]["crew_id"] and e["score"] == rk["rows"][0]["score"]
    assert abs(sum(f["points"] for f in e["factor_table"]) - e["score"]) <= 1
    assert abs(sum(f["share_pct"] for f in e["factor_table"]) - 100) <= 0.5
    assert all(c["passed"] for c in e["rule_checks"]) and e["passes"] is True
    failing = next(r for r in rk["rows"] if not r["ok"])
    e2 = (await t.get(f"/jobs/{jid}/ranking/explanation?crew_id={failing['crew_id']}")).json()
    assert {c["code"] for c in e2["rule_checks"] if not c["passed"]} == {f["code"] for f in failing["failures"]}
    csv_ = await t.get(f"/jobs/{jid}/ranking/explanation.csv")
    assert csv_.status_code == 200 and "Rule,Applies,Passed,Detail" in csv_.text

    cal = (await t.get("/calendar")).json()
    wx = (await t.get("/weather")).json()
    assert wx["cell"] == "demo" and len(wx["days"]) == 28
    assert [d["rain"] or 0 for d in wx["days"]] == cal["rain"][:28]
    assert len((await t.get("/weather?from=2026-10-26&to=2026-10-28")).json()["days"]) == 3

    js = (await t.get("/jobs?queue=true")).json()["items"]
    assert [j["id"] for j in js] == [i["job_id"] for i in q["items"]]
    assert len((await t.get("/jobs?queue=false")).json()["items"]) > 0

    ev = (await t.get("/audit-events?type=Setting&type=Edit")).json()
    assert set(e["type"] for e in ev["items"]) <= {"Setting", "Edit"} and "Integration" in ev["types"]
    assert (await t.get("/audit-events.csv")).text.startswith("When,Who,Type,What")
    s = await scheduler(client, t)
    assert (await s.get("/audit-events")).status_code == 403
