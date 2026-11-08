"""Build step 4: add a job from an estimate; edit a job."""
from __future__ import annotations

import io
import json
import pathlib
import uuid

import pytest

from app.intake.api import get_reader
from app.main import app

from .conftest import As, make_demo

SAMPLES = json.loads((pathlib.Path(__file__).parents[2] / "app" / "intake" / "sample_estimates.json").read_text())
MORALES = SAMPLES["morales"]["text"]


def key():
    return {"Idempotency-Key": str(uuid.uuid4())}


@pytest.fixture(scope="module")
async def t(client) -> As:
    return await make_demo(client, "intake@ppp.example", "Intake test (demo)")


async def areas(t):
    return {a["name"]: a["id"] for a in (await t.get("/service-areas")).json()}


async def test_paste_read_with_rules_and_commit(t: As):
    doc = await t.post("/estimate-documents/text", json={"text": MORALES})
    assert doc.status_code == 201
    r = await t.post(f"/estimate-documents/{doc.json()['id']}/read")
    assert r.status_code == 201, r.text
    d = r.json()
    f = d["fields"]
    A = await areas(t)
    assert d["reader"] == "rules"
    assert (f["client_name"], f["area_id"], f["job_type"], f["year_built"]) == ("Luis & Carmen Morales", A["South Miami"], "exterior", 1968)
    assert (f["sold_hours"], f["price"], f["earliest_start"], f["finish_by"]) == (96, 11350, "2026-11-02", "2026-11-20")
    assert [c["name"] for c in f["colors"]] == ["Agreeable Gray", "Extra White", "Naval"] and f["language"] == "es"
    assert d["sources"]["sold_hours"] == "rules" and d["sources"]["client_name"] == "rules"
    assert "[hours|96 hrs]" in d["marked_text"]
    # edit a field: it becomes "edited"; stale versions are refused
    v = d["version"]
    e = await t.patch(f"/intake-drafts/{d['id']}", json={"finish_by": "2026-11-25"}, headers={"If-Match": f'"{v}"'})
    assert e.status_code == 200 and e.json()["sources"]["finish_by"] == "edited"
    assert (await t.patch(f"/intake-drafts/{d['id']}", json={"price": 1}, headers={"If-Match": f'"{v}"'})).json()["code"] == "version_conflict"
    bad = await t.patch(f"/intake-drafts/{d['id']}", json={"labels": ["Not a label"]}, headers={"If-Match": f'"{v + 1}"'})
    assert bad.status_code == 422
    prev = (await t.get(f"/intake-drafts/{d['id']}/crew-preview")).json()
    assert 1 <= len(prev) <= 3 and all(x["ok"] for x in prev)
    c = await t.post(f"/intake-drafts/{d['id']}/commit", headers=(h := key()))
    assert c.status_code == 201, c.text
    job = c.json()
    assert job["queue_position"] == 1 and job["title"] == "Morales exterior"
    again = await t.post(f"/intake-drafts/{d['id']}/commit", headers=h)
    assert again.json()["job_id"] == job["job_id"]
    q = (await t.get("/queue")).json()
    assert q["items"][0]["job_id"] == job["job_id"] and len(q["items"]) == 5
    rk = (await t.get(f"/jobs/{job['job_id']}/ranking")).json()
    assert rk["rows"] and rk["rows"][0]["crew_name"]
    jd = (await t.get(f"/jobs/{job['job_id']}")).json()
    assert jd["colors_status"] == "confirmed" and jd["year_built"] == 1968 and "read with built-in rules" in jd["source_note"]


async def test_required_fields_and_color_tbd(t: As):
    text = "Interior repaint, 3 bedrooms. Cabinets not included. Doral. Built in 1999. 30 hrs. Total: $3,100."
    d = (await t.post(f"/estimate-documents/{(await t.post('/estimate-documents/text', json={'text': text})).json()['id']}/read")).json()
    c = await t.post(f"/intake-drafts/{d['id']}/commit", headers=key())
    assert c.status_code == 422 and c.json()["code"] == "missing_required_fields"
    assert {e["field"] for e in c.json()["errors"]} == {"earliest_start", "finish_by"}
    e = await t.patch(f"/intake-drafts/{d['id']}", json={"earliest_start": "2026-11-09", "finish_by": "2026-11-20", "client_name": "Pat Rivera"},
                      headers={"If-Match": f'"{d["version"]}"'})
    c = await t.post(f"/intake-drafts/{e.json()['id']}/commit", headers=key())
    assert c.status_code == 201
    jd = (await t.get(f"/jobs/{c.json()['job_id']}")).json()
    assert jd["colors_status"] == "tbd" and [x["name"] for x in jd["colors"]] == ["Color TBD"]
    assert any(x["name"] == "Pat Rivera" for x in (await t.get("/clients", params={"q": "rivera"})).json())


async def test_client_history_fills_language_and_important(t: As):
    text = "Client: Rosa & Daniel Hernandez\nInterior repaint, Pinecrest. 40 hrs. Total $4,800. Start after Nov 9, finish by Nov 30."
    d = (await t.post(f"/estimate-documents/{(await t.post('/estimate-documents/text', json={'text': text})).json()['id']}/read")).json()
    f = d["fields"]
    assert f["client_id"] and f["important"] is True and f["important_reason"] == "Returning client (2019 interior)"
    assert f["language"] == "es" and d["sources"]["language"] == "client_history"


async def test_files_pdf_docx_and_bad_files(t: As):
    from docx import Document
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    y = 800
    for line in MORALES.splitlines():
        c.drawString(40, y, line[:110])
        y -= 14
    c.save()
    r = await t.c.post("/api/v1/estimate-documents", headers=t.h(), files={"file": ("Morales.pdf", buf.getvalue(), "application/pdf")})
    assert r.status_code == 201 and r.json()["page_count"] == 1
    d = (await t.post(f"/estimate-documents/{r.json()['id']}/read")).json()
    assert d["fields"]["sold_hours"] == 96 and d["fields"]["client_name"] == "Luis & Carmen Morales"
    doc = Document()
    for line in SAMPLES["nguyen"]["text"].splitlines():
        doc.add_paragraph(line)
    b2 = io.BytesIO()
    doc.save(b2)
    r = await t.c.post("/api/v1/estimate-documents", headers=t.h(), files={"file": ("Nguyen.docx", b2.getvalue(), "application/octet-stream")})
    assert r.status_code == 201, r.text
    d = (await t.post(f"/estimate-documents/{r.json()['id']}/read")).json()
    assert d["fields"]["client_name"] and d["fields"]["sold_hours"]
    r = await t.c.post("/api/v1/estimate-documents", headers=t.h(), files={"file": ("x.pdf", b"not a pdf", "application/pdf")})
    assert r.status_code == 422 and r.json()["code"] == "unreadable_document"
    r = await t.c.post("/api/v1/estimate-documents", headers=t.h(), files={"file": ("x.txt", b"too short", "text/plain")})
    assert r.status_code == 422
    assert (await t.post("/estimate-documents/text", json={"text": "hi"})).status_code == 422


PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082")


class FakeReader:
    name = "fake"

    def __init__(self, reply=None, fail=False):
        self.reply, self.fail, self.calls = reply, fail, []

    async def read(self, prompt, text, image):
        self.calls.append((prompt, text, image))
        if self.fail:
            raise RuntimeError("AI down")
        return self.reply


async def test_photo_needs_ai_and_ai_reader(t: As):
    up = await t.c.post("/api/v1/estimate-documents", headers=t.h(), files={"file": ("scan.png", PNG, "image/png")})
    assert up.status_code == 201
    r = await t.post(f"/estimate-documents/{up.json()['id']}/read")
    assert r.status_code == 503 and r.json()["code"] == "reader_unavailable"
    reply = {"title": "Lee interior", "client": "Grace Lee", "area": "Kendall", "type": "interior", "built": 1970, "hours": 48, "value": 5200,
             "earliest": "2026-11-10", "deadline": "2026-11-24", "colors": [{"name": "Sea Salt"}], "skills": ["prep"], "lang": "en",
             "hoa": False, "important": None, "evidence": {"client": "Client: Grace Lee", "hours": "48 hours"},
             "sourceText": "Client: Grace Lee. Interior repaint, Kendall. 48 hours. Total $5,200."}
    fake = FakeReader(reply)
    app.dependency_overrides[get_reader] = lambda: fake
    try:
        r = await t.post(f"/estimate-documents/{up.json()['id']}/read")
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["reader"] == "ai" and d["fields"]["client_name"] == "Grace Lee" and d["sources"]["client_name"] == "ai"
        assert d["sources"]["year_built"] == "guessed"   # found but no quote
        assert fake.calls[0][2][1] == "image/png" and "Today is Monday Oct 26, 2026" in fake.calls[0][0]
        # AI failure on text falls back to the built-in rules
        app.dependency_overrides[get_reader] = lambda: FakeReader(fail=True)
        doc = await t.post("/estimate-documents/text", json={"text": MORALES})
        d = (await t.post(f"/estimate-documents/{doc.json()['id']}/read")).json()
        assert d["reader"] == "rules" and d["fields"]["sold_hours"] == 96
    finally:
        app.dependency_overrides.pop(get_reader, None)


async def test_paintscout_stub(t: As):
    lst = (await t.get("/paintscout/sold-estimates")).json()
    assert {x["id"] for x in lst} == {"feld", "morales2", "nguyen2"}
    d = (await t.post("/paintscout/sold-estimates/feld/import")).json()
    assert d["fields"]["client_name"] == "Marcy Feld" and d["sources"]["client_name"] == "paintscout"
    assert d["fields"]["sold_hours"] == 44 and d["sources"]["sold_hours"] == "typed"
    assert d["fields"]["earliest_start"] == "2026-11-02" and d["sources"]["earliest_start"] == "typed"
    assert (await t.post("/paintscout/sold-estimates/nope/import")).status_code == 404


async def test_edit_job_replans_placement(t: As):
    q = (await t.get("/queue")).json()
    jid = next(i["job_id"] for i in q["items"] if i["title"].startswith("Hernandez"))
    p = (await t.post(f"/jobs/{jid}/placement", json={})).json()
    end_before = p["visits"][-1]["end"]
    job = (await t.get(f"/jobs/{jid}")).json()
    r = await t.patch(f"/jobs/{jid}", json={"sold_hours": 60}, headers={"If-Match": f'"{job["version"]}"'})
    assert r.status_code == 200 and r.json()["changes"] == ["Hours 120.0 → 60.0"]
    p2 = (await t.get(f"/placements/{p['id']}")).json()
    assert p2["visits"][0]["start"] == p["visits"][0]["start"] and p2["visits"][-1]["end"] < end_before
    assert (await t.patch(f"/jobs/{jid}", json={"sold_hours": 70}, headers={"If-Match": f'"{job["version"]}"'})).json()["code"] == "version_conflict"
    nochange = await t.patch(f"/jobs/{jid}", json={"sold_hours": 60}, headers={"If-Match": f'"{r.json()["version"]}"'})
    assert nochange.json()["changes"] == []
