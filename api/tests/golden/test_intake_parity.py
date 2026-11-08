"""The rules reader, the draft merge and the marked write-up must match the prototype (fixtures: capture_intake.py)."""
from __future__ import annotations

import json
import pathlib
from datetime import date

from app.intake.readers import ClientHistory, mark_text, rule_read, to_draft

D = json.loads((pathlib.Path(__file__).parent / "intake" / "intake.json").read_text())
AREAS = D["AREAS"] + ["South Miami", "Westchester", "Homestead", "Miami Beach", "Pompano Beach"]
TODAY = date(2026, 10, 25)
JOB_TYPES = [d["k"] for d in D["DIMS"] if d["g"] == "job"]
SKILLS = [d["k"] for d in D["DIMS"] if d["g"] == "skill"]
FIELDS = ["client", "area", "type", "built", "hours", "value", "earliest", "deadline", "skills", "lang", "hoa", "important", "colors", "title"]
# Intentional fix: longest area name first ("Miami Beach", not "Miami").
AREA_FIX = {"Venetian plaster accent wall, Miami Beach.": "Miami Beach"}


def history_for(name):
    """Prototype clientByName over its sample CLIENTS."""
    if not name:
        return None
    low = name.lower()
    ln = [x for x in low.replace("&", " ").split(" ") if x][-1]
    c = next((c for c in D["CLIENTS"] if c["name"].lower() == low), None) or \
        next((c for c in D["CLIENTS"] if ln in [x for x in c["name"].lower().replace("&", " ").split(" ") if x]), None)
    if not c:
        return None
    past = c["past"]
    return ClientHistory(client_id=c["id"], language=c["lang"], history=f"{past[0][0]} {past[0][1].lower()}" if past else None)


def cases():
    for k, s in D["samples"].items():
        yield k, s
    for i, s in enumerate(D["extra"]):
        yield f"extra{i}", s


def test_rule_reader():
    for name, s in cases():
        got = rule_read(s["text"], AREAS, TODAY)
        exp = dict(s["rule"])
        for prefix, area in AREA_FIX.items():
            if s["text"].startswith(prefix):
                exp["area"] = area
                exp["evidence"] = {**exp["evidence"], "area": area}
        for f in FIELDS:
            assert got[f] == exp[f], (name, f, got[f], exp[f])
        assert got["evidence"] == exp["evidence"], name


def test_draft_merge_and_marked_text():
    for name, s in cases():
        smp = {"ps": s.get("ps"), "human": s.get("human")}
        ps = {k: v for k, v in (smp["ps"] or {}).items() if k != "sold"}
        typed = dict(smp["human"] or {})
        d = to_draft(None, s["text"], "rules", areas=AREAS, job_types=JOB_TYPES, skills=SKILLS, today=TODAY, paintscout=ps, typed=typed,
                     history=None)
        h = history_for(d.client)
        d = to_draft(None, s["text"], "rules", areas=AREAS, job_types=JOB_TYPES, skills=SKILLS, today=TODAY, paintscout=ps, typed=typed,
                     history=h)
        e = s["draft"]
        if any(s["text"].startswith(p) for p in AREA_FIX):
            continue
        assert d.title == e["title"] and d.client == e["client"] and (d.area or "") == e["area"], name
        assert d.type == e["type"] and d.built == e["built"] and d.hours == e["hours"] and d.value == e["value"], name
        assert [[c["name"], c["hex"]] for c in d.colors] == e["colors"], name
        assert d.skills == e["skills"] and (d.lang or "") == e["lang"] and d.hoa == e["hoa"], name
        assert d.important == e["impOn"] and d.important_reason == e["important"], name
        assert d.labels == e["labels"] and d.evidence == e["ev"], name
        proto_src = {k: ("rules" if v == "ai" else {"ps": "paintscout", "human": "typed", "history": "client_history"}.get(v, v))
                     for k, v in e["src"].items()}
        assert d.sources == proto_src, (name, d.sources, proto_src)
        assert mark_text(s["text"], d.evidence) == s["marked"], name
