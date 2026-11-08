"""Load the prototype's state (as captured in golden fixtures) into an engine Snapshot.

Used by the golden tests and by the demo-tenant seed, so demo tenants start with the same
sample data the prototype ships with.
"""
from __future__ import annotations

from .model import (Crew, Day, Dimension, FixedBooking, Habit, Hours, Job, OptimizerFeedback, Placement, Rules,
                    Snapshot)

# The prototype's three sample habits, as structured conditions (their JS tests, rewritten as data).
SAMPLE_HABIT_CONDITIONS = {
    "p1": {"job_type": "exterior", "min_value": 12000},          # j.type==='exterior'&&j.value>=12000
    "p2": {"job_type": "commercial"},                              # j.type==='commercial'
    "p3": {"job_type": "interior", "skills_any": ["drywall"]},    # j.type==='interior'&&j.skills.includes('drywall')
}


def _hours(h) -> Hours | None:
    if not h:
        return None
    t = lambda v: tuple(v) if v else None
    return Hours(wk=t(h.get("wk")), sat=t(h.get("sat")), sun=t(h.get("sun")))


def crew_from_prototype(c: dict) -> Crew:
    f = c.get("f") or {}
    size = f.get("size")
    return Crew(
        id=c["id"], name=c["name"], status=f.get("status") or None,
        size=(size["min"], size["max"]) if size else None, base=f.get("base") or None, region=f.get("region") or None,
        languages=f.get("languages") or "", lead_safe=f.get("leadSafe"), hours=_hours(f.get("hours")),
        ratings=dict(c.get("r") or {}), review_counts=dict(c.get("rc") or {}), rating_sources=dict(c.get("rsrc") or {}),
    )


def job_from_prototype(j: dict) -> Job:
    return Job(id=j["id"], title=j["title"], area=j["area"], type=j["type"], hours=j["hours"], earliest=j["earliest"],
               deadline=j["deadline"], value=j.get("value") or 0, region=j.get("region"), ext=bool(j.get("ext")),
               built=j.get("built"), lang=j.get("lang") or "en", skills=list(j.get("skills") or []), signals=dict(j.get("sig") or {}))


def placement_from_prototype(p: dict) -> Placement:
    return Placement(crew=p["crew"], segs=[list(s) for s in p["segs"]], status=p.get("status") or "draft",
                     extra=list(p.get("extra") or []), half=p.get("half"), holds=list(p.get("holds") or []),
                     by=p.get("by"), by_crew=p.get("byCrew"))


def snapshot_from_prototype(i: dict) -> Snapshot:
    r = i["rules"]
    rec = {x["k"]: x["added"] for x in i["RECOMMENDED"]}
    ofb = i.get("ofb") or {}
    return Snapshot(
        days=[Day(**d) for d in i["DL"]],
        crews=[crew_from_prototype(c) for c in i["CREWS"]],
        jobs={k: job_from_prototype(v) for k, v in i["JOBS"].items()},
        queue=list(i["QORDER"]),
        fixed=[FixedBooking(id=b["id"], crew=b["crew"], name=b["name"], what=b["what"], s=b["s"], e=b["e"],
                            value=b.get("value") or 0, half=b.get("half")) for b in i["BOOKS"]],
        place={k: placement_from_prototype(v) for k, v in (i.get("place") or {}).items()},
        shift=dict(i.get("shift") or {}), reassign=dict(i.get("reassign") or {}),
        rules=Rules(min_type=r["minType"], lead=r["lead"], imp=r["imp"], imp_bar=r["impBar"], weather=r["weather"],
                    max_drive=r["maxDrive"], untested=r["untested"], region=r["region"], min_reviews=r["minReviews"]),
        imp_on=dict(i["impOn"]), imp_value=i["impValue"], hours_default=_hours(i["hoursDefault"]),
        labels={k: dict(v["w"]) for k, v in i["LABELS"].items()},
        job_label=dict(i.get("label") or {}), job_weights={k: dict(v) for k, v in (i.get("w") or {}).items()},
        dims=[Dimension(k=d["k"], label=d["l"], group=d["g"]) for d in i["DIMS"]],
        rain_prob=[w[0] for w in i["WX"]],
        geo={k: (v[0], v[1]) for k, v in i["GEO"].items()},
        hist=dict(i["HIST"]), avg_cost=i["AVG_COST"], langs=dict(i["LANGS"]),
        lead_tracked=bool(rec.get("leadSafe")), lang_tracked=bool(rec.get("languages")),
        habits=[Habit(id=h["id"], text=h["text"], status=h["status"], crew=h.get("crew"), avoid=h.get("avoid"),
                      n=h.get("n") or 1, condition=SAMPLE_HABIT_CONDITIONS.get(h["id"])) for h in i.get("learned") or []],
        lock=i.get("lock", 5), win=(i["optWin"]["from"], i["optWin"]["to"]), opt_all=bool(i.get("optAll")),
        opt_margin=bool(i.get("optMargin")),
        ofb=OptimizerFeedback(reject=dict(ofb.get("reject") or {}), no_move=dict(ofb.get("noMove") or {}), block=list(ofb.get("block") or [])),
    )
