"""Create a demo tenant seeded with the prototype's sample data (Phase 2: workspace module, demo tenants).

The data file is the prototype's state at load (captured with the golden fixtures). A demo tenant pins its
calendar to the prototype's first day so rankings match the prototype exactly.
"""
from __future__ import annotations

import json
import pathlib
import uuid
from datetime import date, time, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.assistant.models import AssistantHabit, AssistantQuestion, AssistantState
from app.clients.models import Client, ClientSignal
from app.core.db import set_tenant
from app.crews.models import Crew, CrewCostPeriod, CrewHours, CrewMember, CrewRating
from app.geo.models import Region, ServiceArea
from app.jobs.models import Job, JobFieldSource, JobLabelLink, JobSkill
from app.platform.models import AppUser, Membership, Tenant
from app.scheduling.engine.prototype import SAMPLE_HABIT_CONDITIONS
from app.scheduling.models import Placement, PlacementCrew, PlacementVisit
from app.messaging.builders import DEFAULT_TRIGGERS
from app.settings.models import (DefaultHours, ImportantTrigger, JobLabel, MessageTrigger, ProjectManager, RankingLabel,
                                 RankingLabelWeight, RatingDimension, SchedulingRules)
from app.trades.painting.models import PaintingColor, PaintingJob
from app.weather.models import WeatherDay

DATA = pathlib.Path(__file__).with_name("demo_data.json")
KIND = {"job": "job_type", "skill": "skill", "attr": "attribute"}
SRC = {"ps": "paintscout", "human": "typed", "ai": "ai", "rules": "rules"}
RILEY_QUESTIONS = [
    ("admin", "bias", "Carla picked Tania over a higher-ranked crew on 3 of the last 4 HOA jobs, with no reason given. Should HOA jobs prefer Tania?",
     ["Yes, make it a habit", "No, treat it as chance", "Ask Carla for a reason"]),
    ("admin", "rule", "Gutierrez prefers Haitian Creole, and no ready crew lists Creole. Should the client\u2019s language be a must-have or nice to have?",
     ["Must-have", "Nice to have"]),
    ("scheduler", "learn", "You moved Okafor to Johan & Dani after the optimizer suggested Gian. Was that about drive time, cost or something else?",
     ["Drive time", "Cost", "Keep Gian free for bigger jobs", "Something else"]),
]
JOB_LABELS = ["HOA", "Repeat client", "Occupied home", "Rush", "Commercial", "Pets on site", "Gated community"]


def _t(v: str | None) -> time | None:
    return time.fromisoformat(v) if v else None


async def ensure_user(s: AsyncSession, email: str, name: str) -> AppUser:
    u = (await s.execute(select(AppUser).where(AppUser.email == email.lower()))).scalar_one_or_none()
    if not u:
        u = AppUser(email=email.lower(), display_name=name)
        s.add(u)
        await s.flush()
    return u


async def create_demo_tenant(s: AsyncSession, owner: AppUser, name: str = "PPP (demo)") -> Tenant:
    d = json.loads(DATA.read_text())
    anchor = date.fromisoformat(d["DL"][0]["iso"])
    day = lambda i: anchor + timedelta(days=i)
    tid = uuid.uuid4()
    await set_tenant(s, tid)
    tenant = Tenant(id=tid, name=name, message_name="Precision Painting Plus", time_zone="America/New_York", status="trial",
                    is_demo=True, calendar_anchor=anchor)
    s.add(tenant)
    await s.flush()
    s.add(Membership(tenant_id=tid, user_id=owner.id, role="owner", display_name=owner.display_name))
    # Riley's sample history and questions from the prototype
    s.add(AssistantState(tenant_id=tid, stage=0, base_observed=46, base_agreed=34,
                         base_by_type={"exterior": [18, 15], "interior": [14, 10], "cabinets": [6, 5], "commercial": [8, 4]}))
    for i, q in enumerate(RILEY_QUESTIONS):
        s.add(AssistantQuestion(tenant_id=tid, audience=q[0], kind=q[1], text=q[2], options=q[3], sort_order=i))

    r = d["rules"]
    rec = {x["k"]: x["added"] for x in d["RECOMMENDED"]}
    s.add(SchedulingRules(tenant_id=tid, weather_rule=r["weather"], lead_rule=r["lead"], important_rule=r["imp"], important_bar=r["impBar"],
                          region_rule=r["region"], max_drive_min=r["maxDrive"], min_type_rating=r["minType"], min_reviews=r["minReviews"],
                          allow_unrated=r["untested"], lock_days=d["lock"], important_value=d["impValue"],
                          lead_safe_tracked=bool(rec.get("leadSafe")), languages_tracked=bool(rec.get("languages"))))
    for trig, roles in DEFAULT_TRIGGERS.items():
        for role, on in roles.items():
            s.add(MessageTrigger(tenant_id=tid, trigger=trig, recipient_role=role, enabled=on))
    for pm in d.get("PMS", {"bo": {"name": "Bo", "channel": "text", "phone": "(305) 555-0170"},
                            "alan": {"name": "Alan", "channel": "email", "phone": "(305) 555-0175"}}).values():
        s.add(ProjectManager(tenant_id=tid, name=pm["name"], channel=pm["channel"], phone=pm.get("phone")))
    for k, on in d["impOn"].items():
        s.add(ImportantTrigger(tenant_id=tid, key=k, enabled=on))
    hd = d["hoursDefault"]
    for kind, key in (("weekday", "wk"), ("saturday", "sat"), ("sunday", "sun")):
        v = hd.get(key)
        s.add(DefaultHours(tenant_id=tid, day_kind=kind, start_time=_t(v[0]) if v else None, end_time=_t(v[1]) if v else None))

    dims = {}
    for i, x in enumerate(d["DIMS"]):
        dims[x["k"]] = RatingDimension(tenant_id=tid, key=x["k"], label=x["l"], kind=KIND[x["g"]], trade="painting", sort_order=i)
        s.add(dims[x["k"]])
    for i, (lname, lab) in enumerate(d["LABELS"].items()):
        L = RankingLabel(tenant_id=tid, name=lname, description=lab.get("d", ""), sort_order=i,
                         is_default=lname == "Balanced", is_default_important=lname == "White glove")
        s.add(L)
        await s.flush()
        for j, (fk, w) in enumerate(lab["w"].items()):
            s.add(RankingLabelWeight(tenant_id=tid, label_id=L.id, factor_key=fk, weight=w, sort_order=j))
    labels = {n: JobLabel(tenant_id=tid, name=n) for n in JOB_LABELS}
    s.add_all(labels.values())

    regions: dict[str, Region] = {}

    def region(name: str | None) -> Region | None:
        if not name:
            return None
        if name not in regions:
            regions[name] = Region(tenant_id=tid, name=name)
            s.add(regions[name])
        return regions[name]

    for c in d["CREWS"] + list(d["JOBS"].values()):
        region((c.get("f") or c).get("region"))
    await s.flush()
    area_region = {}
    for c in d["CREWS"]:
        if c["f"].get("base"):
            area_region.setdefault(c["f"]["base"], c["f"].get("region"))
    for j in d["JOBS"].values():
        area_region.setdefault(j["area"], j.get("region"))
    areas = {}
    for name, (lat, lng) in d["GEO"].items():
        rg = regions.get(area_region.get(name) or "")
        areas[name] = ServiceArea(tenant_id=tid, name=name, region_id=rg.id if rg else None, location=f"SRID=4326;POINT({lng} {lat})")
        s.add(areas[name])
    await s.flush()

    crews = {}
    for i, c in enumerate(d["CREWS"]):
        f = c["f"]
        size = f.get("size")
        crew = Crew(tenant_id=tid, name=c["name"], color=c.get("c") or "#2F6BD8", status=f.get("status") or "active",
                    size_min=size["min"] if size else None, size_max=size["max"] if size else None,
                    base_area_id=areas[f["base"]].id if f.get("base") in areas else None,
                    region_id=regions[f["region"]].id if f.get("region") else None, languages=f.get("languages") or "",
                    lead_language=f.get("clang"), channel=f.get("channel") or None, lead_safe_certified=f.get("leadSafe"),
                    phone=f.get("phone") or None, email=f.get("email") or None, notes=f.get("notes") or "", pay_note=f.get("pay"),
                    salesforce_name=f.get("sfName") or None, calendar_id=f.get("gcal") or None, sort_order=i)
        s.add(crew)
        await s.flush()
        crews[c["id"]] = crew
        for k, v in (c.get("r") or {}).items():
            s.add(CrewRating(tenant_id=tid, crew_id=crew.id, dimension_id=dims[k].id, value=v,
                             source="admin" if (c.get("rsrc") or {}).get(k) == "admin" else "reviews",
                             review_count=(c.get("rc") or {}).get(k) or 0))
        h = f.get("hours")
        if h:
            for kind, key in (("weekday", "wk"), ("saturday", "sat"), ("sunday", "sun")):
                v = h.get(key)
                s.add(CrewHours(tenant_id=tid, crew_id=crew.id, day_kind=kind, start_time=_t(v[0]) if v else None, end_time=_t(v[1]) if v else None))
        for j, mbr in enumerate(c.get("members") or []):
            s.add(CrewMember(tenant_id=tid, crew_id=crew.id, name=mbr["n"], role=mbr.get("role") or "Painter", is_lead=bool(mbr.get("lead")),
                             languages=mbr.get("langs") or "", note=mbr.get("note") or "", phone=mbr.get("phone") or None, sort_order=j))
        hist = d["HIST"].get(c["id"])
        if hist:
            s.add(CrewCostPeriod(tenant_id=tid, crew_id=crew.id, sold_hours=hist["sold"], actual_hours=hist["actual"], crew_pay=hist["pay"],
                                 jobs_count=hist.get("jobs"), five_star_reviews=hist.get("five")))

    # Queue jobs, each with a client
    for pos, jid in enumerate(d["QORDER"], start=1):
        j = d["JOBS"][jid]
        cl = Client(tenant_id=tid, name=j["client"], first_name=j["client"].split(" ")[0], language=j.get("lang") or "en",
                    service_area_id=areas[j["area"]].id)
        s.add(cl)
        await s.flush()
        sig = j.get("sig") or {}
        if any(sig.get(k) for k in ("returning", "referrals", "crm", "trade")):
            s.add(ClientSignal(tenant_id=tid, client_id=cl.id, returning_since=sig.get("returning"), referral_count=sig.get("referrals") or 0,
                               crm_vip=bool(sig.get("crm")), trade_type=sig.get("trade")))
        job = Job(tenant_id=tid, title=j["title"], client_id=cl.id, job_type_id=dims[j["type"]].id, service_area_id=areas[j["area"]].id,
                  region_id=regions[j["region"]].id if j.get("region") else None, sold_hours=j["hours"], price=j.get("value"),
                  earliest_start=day(j["earliest"]), finish_by=day(j["deadline"]), language=j.get("lang") or "en",
                  important_note=sig.get("manual"), queue_position=pos, write_up=j.get("writeup"), source_note=j.get("src"),
                  photos_count=j.get("photos"))
        s.add(job)
        await s.flush()
        for k, sk in enumerate(j.get("skills") or []):
            s.add(JobSkill(tenant_id=tid, job_id=job.id, dimension_id=dims[sk].id, sort_order=k))
        for ln in j.get("labels") or []:
            if ln not in labels:
                labels[ln] = JobLabel(tenant_id=tid, name=ln)
                s.add(labels[ln])
                await s.flush()
            s.add(JobLabelLink(tenant_id=tid, job_id=job.id, job_label_id=labels[ln].id))
        for field, src in (j.get("srcs") or {}).items():
            if src in SRC:
                s.add(JobFieldSource(tenant_id=tid, job_id=job.id, field=field, source=SRC[src]))
        cs = j.get("colorsOk")
        s.add(PaintingJob(tenant_id=tid, job_id=job.id, year_built=j.get("built"), is_exterior=bool(j.get("ext")), hoa=bool(j.get("hoa")),
                          colors_status="confirmed" if cs is True else "sent" if cs == "sent" else "tbd"))
        for k, (cname, hx) in enumerate(j.get("colors") or []):
            s.add(PaintingColor(tenant_id=tid, job_id=job.id, color_name=cname, hex=hx, sort_order=k))

    # Confirmed work already on the calendar (prototype BOOKS) -> jobs with scheduled placements (DD-03)
    type_by_word = {x["l"].split(" ")[0]: x["k"] for x in d["DIMS"] if x["g"] == "job"}
    for b in d["BOOKS"]:
        crew = crews[b["crew"]]
        days_n = b["e"] - b["s"] + 1
        job = Job(tenant_id=tid, title=b["name"], job_type_id=dims[type_by_word[b["what"]]].id, service_area_id=crew.base_area_id,
                  region_id=crew.region_id, sold_hours=days_n * 8 * (crew.size_min or 1) * (0.5 if b.get("half") else 1),
                  price=b.get("value") or 0, earliest_start=day(b["s"]), finish_by=day(b["e"]), queue_position=None)
        s.add(job)
        await s.flush()
        p = Placement(tenant_id=tid, job_id=job.id, status="scheduled", half_day=b.get("half"), source="import")
        s.add(p)
        await s.flush()
        s.add(PlacementCrew(tenant_id=tid, placement_id=p.id, crew_id=crew.id, role="lead"))
        s.add(PlacementVisit(tenant_id=tid, placement_id=p.id, seq=1, start_date=day(b["s"]), end_date=day(b["e"])))

    for i, h in enumerate(d["learned"]):
        s.add(AssistantHabit(tenant_id=tid, text=h["text"], condition=SAMPLE_HABIT_CONDITIONS.get(h["id"]),
                             prefer_crew_id=crews[h["crew"]].id if h.get("crew") else None,
                             avoid_crew_id=crews[h["avoid"]].id if h.get("avoid") else None,
                             status=h["status"], source="import", evidence_count=h.get("n") or 1, sort_order=i))

    for i, (prob, cond) in enumerate(d["WX"]):
        await s.execute(insert(WeatherDay).values(cell="demo", day=day(i), rain_probability=prob, condition=cond, source="sample")
                        .on_conflict_do_nothing())
    await s.flush()
    return tenant
