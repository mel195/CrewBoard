"""Build step 3: placements, decisions, messages. Runs on its own demo tenant so other tests aren't affected."""
from __future__ import annotations

import json
import pathlib
import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy import text

from app.core.db import sessionmaker

from .conftest import As, make_demo

GOLD = pathlib.Path(__file__).parents[1] / "golden"
BASE = json.loads((GOLD / "fixtures" / "base.json").read_text())
MSGS = json.loads((GOLD / "messages" / "messages.json").read_text())
ANCHOR = date.fromisoformat(BASE["inputs"]["DL"][0]["iso"])
CREW = {c["id"]: c["name"] for c in BASE["inputs"]["CREWS"]}


def day(i: int) -> str:
    return (ANCHOR + timedelta(days=i)).isoformat()


def key() -> dict:
    return {"Idempotency-Key": str(uuid.uuid4())}


@pytest.fixture(scope="module")
async def t(client) -> As:
    return await make_demo(client, "sched@ppp.example", "Scheduling test (demo)")


async def jobs(t: As) -> dict[str, str]:
    q = (await t.get("/queue")).json()
    return {i["title"].split(" ")[0].lower(): i["job_id"] for i in q["items"]}


async def crew_ids(t: As) -> dict[str, str]:
    return {c["name"]: c["id"] for c in (await t.get("/crews")).json()}


async def test_place_confirm_send(t: As):
    J = await jobs(t)
    r = await t.post(f"/jobs/{J['hernandez']}/placement", json={})
    assert r.status_code == 201, r.text
    p = r.json()
    top = BASE["outputs"]["jobs"]["hernandez"]["rank"][0]
    assert (await crew_ids(t))[CREW[top["crew"]]] == p["lead_crew_id"]
    assert p["visits"] == [{"seq": 1, "start": day(top["slot"]["s"]), "end": day(top["slot"]["e"])}]
    assert p["status"] == "draft" and any(d["kind"] == "work" for d in p["days"])
    # Top crew: no reason needed
    pv = (await t.get(f"/placements/{p['id']}/confirm-preview")).json()
    assert pv["reason_required"] is False
    hdr = {"If-Match": f'"{p["version"]}"', **key()}
    c = await t.post(f"/placements/{p['id']}/confirm", json={}, headers=hdr)
    assert c.status_code == 200, c.text
    body = c.json()
    assert body["placement"]["status"] == "scheduled" and body["decision"]["kind"] == "confirm"
    assert body["riley_agreed"] is True
    # Messages: same texts as the prototype builds for this job, crew and dates
    gold = next(x for x in MSGS["cases"] if x["jid"] == "hernandez" and x["trigger"] == "confirm")["msgs"]
    got = {m["recipient_role"]: m["body"] for m in body["message_batch"]["messages"]}
    for g in gold:
        if g["role"] in ("crew", "hoa"):
            assert got[g["role"]] == g["text"]
    assert got["client"] == next(g for g in gold if g["role"] == "client")["all"]["es"]   # client prefers Spanish
    assert body["message_batch"]["status"] == "draft"
    # Replay with the same key returns the same result; a different body with the same key is refused
    again = await t.post(f"/placements/{p['id']}/confirm", json={}, headers=hdr)
    assert again.status_code == 200 and again.json()["decision"]["id"] == body["decision"]["id"]
    clash = await t.post(f"/placements/{p['id']}/confirm", json={"reason_code": "Other"}, headers=hdr)
    assert clash.status_code == 409 and clash.json()["code"] == "idempotency_mismatch"
    # Edit a message's language, then send (logged only)
    batch = body["message_batch"]
    client_msg = next(m for m in batch["messages"] if m["recipient_role"] == "client")
    e = await t.patch(f"/message-batches/{batch['id']}/messages/{client_msg['id']}", json={"language": "en"})
    assert e.status_code == 200 and e.json()["body"].startswith("Hello Rosa and Daniel")
    s = await t.post(f"/message-batches/{batch['id']}/send", headers=key())
    assert s.status_code == 200 and s.json()["status"] == "sent"
    assert all(m["status"] == "logged" for m in s.json()["messages"])
    assert (await t.post(f"/message-batches/{batch['id']}/send", headers=key())).json()["code"] == "batch_closed"
    log = (await t.get("/messages", params={"job_id": J["hernandez"]})).json()
    assert len(log) == len(batch["messages"])


async def test_override_needs_reason_and_teaches_riley(t: As):
    J = await jobs(t)
    jid = J["okafor"]
    rank = (await t.get(f"/jobs/{jid}/ranking")).json()
    second = [r for r in rank["rows"] if r["ok"]][1]
    p = (await t.post(f"/jobs/{jid}/placement", json={"lead_crew_id": second["crew_id"]})).json()
    r = await t.post(f"/placements/{p['id']}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert r.status_code == 422 and r.json()["code"] == "reason_required" and "Client asked for this crew" in r.json()["reasons"]
    r = await t.post(f"/placements/{p['id']}/confirm", json={"reason_code": "Other"}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert r.json()["code"] == "reason_note_required"
    r = await t.post(f"/placements/{p['id']}/confirm", json={"reason_code": "Client asked for this crew"},
                     headers={"If-Match": f'"{p["version"]}"', **key()})
    assert r.status_code == 200, r.text
    d = r.json()["decision"]
    assert d["kind"] == "override" and d["reason"] == "Client asked for this crew" and r.json()["riley_agreed"] is False
    full = (await t.get(f"/decisions/{d['id']}")).json()
    assert full["score_snapshot"][0]["crew"] == rank["rows"][0]["crew_name"]
    async with sessionmaker()() as s:
        async with s.begin():
            await s.execute(text("select set_config('app.tenant_id', :t, true)"), {"t": t.tenant_id})
            n = (await s.execute(text("select count(*) from ops.assistant_habit where status='new' and text like '%picked%over%Reason: Client asked%'"))).scalar()
            assert n == 1
            obs = (await s.execute(text("select agreed from ops.assistant_observation order by created_at"))).scalars().all()
            assert obs == [True, False]


async def test_manual_pick_asks_why(t: As):
    J = await jobs(t)
    crews = await crew_ids(t)
    r = await t.post(f"/jobs/{J['patel']}/placement", json={"lead_crew_id": crews["Rigo"], "manual": True})
    assert r.status_code == 422 and r.json()["code"] == "reason_required"
    r = await t.post(f"/jobs/{J['patel']}/placement", json={"lead_crew_id": crews["Rigo"], "manual": True, "reason_code": "Pairing or training"})
    assert r.status_code == 201 and r.json()["override_reason"] == "Pairing or training"
    # Confirm uses the stored reason without asking again
    p = r.json()
    c = await t.post(f"/placements/{p['id']}/confirm", json={}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert c.status_code == 200 and c.json()["decision"]["reason"] == "Pairing or training"


async def test_drag_split_resize_extra_crew_clear(t: As):
    J = await jobs(t)
    crews = await crew_ids(t)
    p = (await t.post(f"/jobs/{J['gutierrez']}/placement", json={"lead_crew_id": crews["Gian"], "start": day(8)})).json()
    v = p["version"]
    # Sunday is a day off for the default hours
    sunday = next(i for i in range(7, 21) if (ANCHOR + timedelta(days=i)).weekday() == 6)
    r = await t.patch(f"/placements/{p['id']}", json={"start": day(sunday)}, headers={"If-Match": f'"{v}"'})
    assert r.status_code == 422 and r.json()["code"] == "non_working_day"
    r = await t.patch(f"/placements/{p['id']}", json={"start": day(9)}, headers={"If-Match": f'"{v}"'})
    assert r.status_code == 200 and r.json()["visits"][0]["start"] == day(9)
    assert (await t.patch(f"/placements/{p['id']}", json={"start": day(10)}, headers={"If-Match": f'"{v}"'})).json()["code"] == "version_conflict"
    v = r.json()["version"]
    before_len = len([d for d in r.json()["days"] if d["kind"] == "work"])
    r = await t.patch(f"/placements/{p['id']}", json={"extra_crew_ids": [crews["Tania"]]}, headers={"If-Match": f'"{v}"'})
    assert r.status_code == 200 and r.json()["extra_crew_ids"] == [crews["Tania"]]
    assert len([d for d in r.json()["days"] if d["kind"] == "work"]) <= before_len
    v = r.json()["version"]
    r = await t.patch(f"/placements/{p['id']}", json={"extra_crew_ids": []}, headers={"If-Match": f'"{v}"'})
    v = r.json()["version"]
    total = len([d for d in r.json()["days"] if d["kind"] == "work"])
    if total >= 2:
        r = await t.post(f"/placements/{p['id']}/split", headers={"If-Match": f'"{v}"'})
        assert r.status_code == 200 and len(r.json()["visits"]) == 2
        assert len([d for d in r.json()["days"] if d["kind"] == "work"]) == total
        v = r.json()["version"]
        r = await t.post(f"/placements/{p['id']}/split", headers={"If-Match": f'"{v}"'})
        assert len(r.json()["visits"]) == 1
        v = r.json()["version"]
    pms = (await t.get("/project-managers")).json()
    r = await t.patch(f"/placements/{p['id']}", json={"pm_id": pms[0]["id"]}, headers={"If-Match": f'"{v}"'})
    assert r.json()["pm_id"] == pms[0]["id"]
    h = await t.post(f"/jobs/{J['gutierrez']}/handoff")
    assert h.status_code == 200 and [m["recipient_role"] for m in h.json()["messages"]] == ["pm"]
    assert (await t.delete(f"/placements/{p['id']}")).status_code == 204
    assert (await t.get(f"/placements/{p['id']}")).status_code == 404


async def test_move_and_unschedule(t: As):
    J = await jobs(t)
    jid = J["hernandez"]  # confirmed in the first test
    cal = (await t.get("/calendar")).json()
    pid = next(b["placement_id"] for b in cal["bookings"] if b["job_id"] == jid)
    p = (await t.get(f"/placements/{pid}")).json()
    r = await t.post(f"/placements/{pid}/move", json={"start": day(8)}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert r.status_code == 422 and r.json()["code"] == "reason_required" and "Weather" in r.json()["reasons"]
    old = p["visits"][0]["start"]
    r = await t.post(f"/placements/{pid}/move", json={"start": day(8), "reason_code": "Weather"}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert r.status_code == 200, r.text
    m = r.json()
    assert m["decision"]["kind"] == "move" and m["decision"]["before"]["visits"][0]["start"] == old
    assert m["placement"]["visits"][0]["start"] == day(8)
    assert m["message_batch"]["trigger"] == "move"
    crew_msg = next(x for x in m["message_batch"]["messages"] if x["recipient_role"] == "crew")["body"]
    assert crew_msg.startswith("Cambio de horario: Hernandez exterior")
    # Drafts are dragged, confirmed jobs are moved
    v = m["placement"]["version"]
    assert (await t.patch(f"/placements/{pid}", json={"start": day(9)}, headers={"If-Match": f'"{v}"'})).json()["code"] == "already_scheduled"
    u = await t.post(f"/placements/{pid}/unschedule", headers={"If-Match": f'"{v}"', **key()})
    assert u.status_code == 200 and u.json()["placement"]["status"] == "draft"
    assert u.json()["message_batch"]["trigger"] == "cancel"
    decisions = (await t.get(f"/jobs/{jid}/decisions")).json()
    assert [d["kind"] for d in decisions] == ["unschedule", "move", "confirm"]
    async with sessionmaker()() as s:
        try:
            async with s.begin():
                await s.execute(text("select set_config('app.tenant_id', :t, true)"), {"t": t.tenant_id})
                await s.execute(text("update ops.scheduling_decision set reason_code='x'"))
            raise AssertionError("decisions should be append-only")
        except Exception as e:
            assert "permission denied" in str(e)


async def test_review_off_sends_at_once(t: As):
    tr = (await t.get("/settings/message-triggers")).json()
    assert tr["triggers"]["confirm"]["hoa"] is True
    r = await t.put("/settings/message-triggers", json={**tr, "review_before_send": False})
    assert r.status_code == 200 and r.json()["review_before_send"] is False
    J = await jobs(t)
    cal = (await t.get("/calendar")).json()
    pid = next(b["placement_id"] for b in cal["bookings"] if b["job_id"] == J["hernandez"])
    p = (await t.get(f"/placements/{pid}")).json()
    c = await t.post(f"/placements/{pid}/confirm", json={"reason_code": "Schedule or travel reason"}, headers={"If-Match": f'"{p["version"]}"', **key()})
    assert c.status_code == 200, c.text
    assert c.json()["message_batch"]["status"] == "sent"
    await t.put("/settings/message-triggers", json={**tr, "review_before_send": True})


async def test_calendar(t: As):
    cal = (await t.get("/calendar", params={"days": 14})).json()
    assert len(cal["days"]) == 14 and len(cal["rain"]) == 14
    assert any(b["status"] == "confirmed" and b["job_id"] is None for b in cal["bookings"])   # confirmed work outside the queue
    assert all(b["start"] < day(14) for b in cal["bookings"])
    assert (await t.get("/calendar", params={"days": 99})).status_code == 422
