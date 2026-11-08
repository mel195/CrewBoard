"""Message texts must match the prototype exactly, in every language (fixtures from capture_messages.py)."""
from __future__ import annotations

import json
import pathlib

from app.messaging.builders import (DEFAULT_TRIGGERS, MsgCrew, MsgJob, MsgPm, build_color_messages, build_fixed_messages,
                                    build_job_messages)
from app.scheduling.engine.core import set_place
from app.scheduling.engine.prototype import snapshot_from_prototype
from app.scheduling.engine.ranking import hist

HERE = pathlib.Path(__file__).parent
M = json.loads((HERE / "messages" / "messages.json").read_text())
BASE = json.loads((HERE / "fixtures" / "base.json").read_text())


def setup():
    snap = snapshot_from_prototype(BASE["inputs"])
    for jid, crew, s, extra, pm, colors_ok, ml in M["scenario"]:
        set_place(snap, jid, crew, s, "draft", False, extra)
    return snap


def msg_crew(snap, cid):
    c = snap.crew(cid)
    x = M["crews"][cid]
    h = hist(snap, cid)
    return MsgCrew(id=cid, name=c.name, size=c.plan_size, lead_language=x["clang"], channel=x["channel"], phone=x["phone"],
                   cost_per_painter_day=h["costSold"] if h else None)


def msg_job(snap, jid):
    j = snap.jobs[jid]
    raw = BASE["inputs"]["JOBS"][jid]
    over = M["jobs"][jid]
    return MsgJob(title=j.title, client=raw["client"], area=raw["area"], type_key=j.type, type_label=snap.dim_label(j.type), hours=j.hours,
                  ext=j.ext, hoa=bool(raw.get("hoa")), built=j.built, colors=[c[0] for c in raw.get("colors") or []],
                  colors_confirmed=over["colorsOk"] is True, lang=j.lang)


def as_dicts(msgs):
    return [{"key": m.key, "role": m.role, "to": m.to, "channel": m.channel, "lang": m.lang, "text": m.text, "all": m.variants} for m in msgs]


def test_job_messages():
    snap = setup()
    scen = {s[0]: s for s in M["scenario"]}
    for case in M["cases"]:
        jid = case["jid"]
        p = snap.place[jid]
        _, _, _, _, pm, _, ml = scen[jid]
        crews = [msg_crew(snap, c) for c in [p.crew, *p.extra]]
        got = build_job_messages(days=snap.days, company=M["COMPANY"], triggers=DEFAULT_TRIGGERS, avg_cost=snap.avg_cost,
                                 job=msg_job(snap, jid), crews=crews, s=p.segs[0][0], e=p.segs[-1][1], trigger=case["trigger"],
                                 client_lang=ml, pm=MsgPm(**{k: v for k, v in M["PMS"][pm].items()}) if pm else None)
        assert as_dicts(got) == case["msgs"], (jid, case["trigger"])


def test_color_messages():
    snap = setup()
    scen = {s[0]: s for s in M["scenario"]}
    for case in M["colors"]:
        jid = case["jid"]
        p = snap.place[jid]
        pm = scen[jid][4]
        got = build_color_messages(days=snap.days, triggers=DEFAULT_TRIGGERS, job=msg_job(snap, jid),
                                   crews=[msg_crew(snap, c) for c in [p.crew, *p.extra]], s=p.segs[0][0],
                                   pm=MsgPm(**M["PMS"][pm]) if pm else None)
        assert as_dicts(got) == case["msgs"], jid


def test_fixed_messages():
    snap = setup()
    books = {b.id: b for b in snap.fixed}
    for case in M["fixed"]:
        b = books[case["id"]]
        got = build_fixed_messages(days=snap.days, company=M["COMPANY"], triggers=DEFAULT_TRIGGERS, crew=msg_crew(snap, b.crew),
                                   name=b.name, what=b.what, s=b.s, e=b.e, trigger=case["trigger"])
        assert as_dicts(got) == case["msgs"], (b.id, case["trigger"])
