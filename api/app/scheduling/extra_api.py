"""How a score was worked out, rain by day, and the job list (MAT-08, CAL-04, Q-01)."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy import select

from app.clients.models import Client
from app.core.context import Ctx, tenant_ctx
from app.core.errors import AppError, not_found
from app.geo.models import ServiceArea
from app.jobs.models import Job
from app.scheduling.models import Placement
from app.weather.models import WeatherDay
from app.weather.service import area_cell, workspace_cell

from .api import _loaded_job
from .engine.ranking import FACTOR_LABELS, drive_min, imp, label_for, rank, weights
from .snapshot import business_today

router = APIRouter(tags=["scheduling"])

RULES = [  # (code, label) in the order the engine checks them (BL-09 to BL-22)
    ("inactive", "Crew is active"), ("missing_setup", "Crew setup is complete"), ("not_rated", "Rated for this type of work"),
    ("below_min_rating", "Rating meets the minimum"), ("lead_safe", "Lead-safe certified (homes built before 1978)"),
    ("important_bar", "Quality and client-facing meet the important-client bar"), ("region", "Works in the job's region"),
    ("drive_limit", "Within the drive limit"), ("few_reviews", "Enough reviews behind the rating"),
    ("after_deadline", "Finishes by the deadline"), ("no_opening", "Has an opening in the next 4 weeks"),
]


async def _explain(ctx: Ctx, job_id: uuid.UUID, crew_id: uuid.UUID | None) -> dict:
    L, jid = await _loaded_job(ctx, job_id)
    snap = L.snap
    job = snap.jobs[jid]
    rows = rank(snap, jid)
    r = next((x for x in rows if x.crew == str(crew_id)), None) if crew_id else rows[0] if rows else None
    if r is None:
        raise not_found("Crew")
    c = snap.crew(r.crew)
    R = snap.rules
    fails = {f.code: f.message for f in r.fails}
    applies = {
        "inactive": True, "missing_setup": c.status == "active", "not_rated": c.status == "active",
        "below_min_rating": c.status == "active" and c.ratings.get(job.type) is not None,
        "lead_safe": bool(R.lead and snap.lead_tracked and job.built is not None and job.built < 1978),
        "important_bar": bool(R.imp and imp(snap, job)), "region": bool(R.region and c.region and job.region),
        "drive_limit": drive_min(snap, c.base, job.area) is not None, "few_reviews": R.min_reviews > 1,
        "after_deadline": r.slot is not None, "no_opening": True,
    }
    checks = [{"code": k, "rule": label, "applies": applies[k] or k in fails, "passed": k not in fails, "detail": fails.get(k)}
              for k, label in RULES if c.status == "active" or k == "inactive"]
    w = weights(snap, jid)
    used = {k: v for k, v in w.items() if v > 0 and r.f.get(k) is not None}
    total_w = sum(used.values()) or 1
    def flabel(k):
        return FACTOR_LABELS.get(k) or snap.dim_label(k)
    table = [{"factor": k, "label": flabel(k), "value": r.f[k], "weight": v, "share_pct": round(v / total_w * 100, 1),
              "points": round(r.f[k] * v / total_w, 1)} for k, v in sorted(used.items(), key=lambda x: -x[1])]
    not_weighted = [{"factor": k, "label": flabel(k), "value": r.f.get(k), "why": f"Weight 0 in “{label_for(snap, jid)}”"}
                    for k in r.f if k not in used]
    return {"job_id": job_id, "job_title": job.title, "crew_id": uuid.UUID(r.crew), "crew_name": L.crew_names[r.crew], "label": label_for(snap, jid),
            "custom_weights": jid in snap.job_weights, "score": r.score, "passes": r.ok,
            "position": rows.index(r) + 1, "of": len(rows),
            "formula": "Score = sum of (factor value × weight) ÷ sum of weights, rounded. Factors run 0 to 100.",
            "rule_checks": _proto_checks(L, job, c, r), "all_rules": checks, "factor_table": table, "not_weighted": not_weighted,
            "never_used": NEVER_USED, "who_decides": WHO_DECIDES}


NEVER_USED = ("Age, gender, race, ethnicity, national origin, religion, disability or any other personal trait. "
              "Language only counts when the client asks for it.")
WHO_DECIDES = ("This is a suggestion. A scheduler confirms the crew, and picking anyone other than the top crew needs a reason, "
               "saved in the audit log.")
INPUTS_NOTE = ("Inputs used: ratings, certifications, past job results, drive time, availability, client requests. "
               "Not used: age, gender, race, ethnicity, national origin, religion, disability or any other personal trait.")


def _dl(L, i: int) -> str:
    d = L.date(i)
    return f"{d:%a} {d:%b} {d.day}"


def _num(v):
    return int(v) if v is not None and float(v).is_integer() else v


def _proto_checks(L, job, c, r) -> list[dict]:
    """The prototype's five plain-language checks (ruleChecks), in its order."""
    snap, R = L.snap, L.snap.rules
    tl = snap.dim_label(job.type)
    out = []
    rt = c.ratings.get(job.type)
    out.append({"code": "job_type_rating", "rule": f"{tl} rating {_num(R.min_type)}+",
                "passed": (rt is not None and rt >= R.min_type) or (rt is None and R.untested),
                "detail": "Not rated yet" if rt is None else f"Rated {_num(rt)}"})
    if job.built is not None and job.built < 1978 and R.lead:
        out.append({"code": "lead_safe", "rule": f"Lead-safe certified (home built {job.built})", "passed": c.lead_safe is True,
                    "detail": "On file" if c.lead_safe is True else "Not on file"})
    if R.imp and imp(snap, job):
        q, cf = c.ratings.get("quality"), c.ratings.get("client")
        out.append({"code": "important_bar", "rule": f"Quality and client-facing {_num(R.imp_bar)}+ (important client)",
                    "passed": (q or 0) >= R.imp_bar and (cf or 0) >= R.imp_bar,
                    "detail": f"Quality {_num(q) if q is not None else 'not rated'}, client-facing {_num(cf) if cf is not None else 'not rated'}"})
    dm = drive_min(snap, c.base, job.area)
    out.append({"code": "drive_limit", "rule": f"Within {R.max_drive} min drive", "passed": dm is not None and dm <= R.max_drive,
                "detail": f"{dm} min from {c.base}" if dm is not None else "No home base"})
    out.append({"code": "deadline", "rule": f"Done by {_dl(L, job.deadline)}", "passed": bool(r.slot) and r.slot.e <= job.deadline,
                "detail": f"Earliest finish {_dl(L, r.slot.e)}" if r.slot else "No opening in 4 weeks"})
    return out


@router.get("/jobs/{job_id}/ranking/explanation", operation_id="jobs_ranking_explanation")
async def explanation(job_id: uuid.UUID, crew_id: uuid.UUID | None = None, ctx: Ctx = Depends(tenant_ctx)):
    """For one crew (the top crew by default): the prototype's five rule checks (plus the full rule list), each factor with its
    weight and points, what's never used, and who decides (MAT-08)."""
    return await _explain(ctx, job_id, crew_id)


@router.get("/jobs/{job_id}/ranking/explanation.csv", response_class=PlainTextResponse, operation_id="jobs_ranking_explanation_csv")
async def explanation_csv(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    """The prototype's score record (exportscore): every crew, with each weighted factor's value, weight and points."""
    L, jid = await _loaded_job(ctx, job_id)
    snap = L.snap
    job = snap.jobs[jid]
    rows = rank(snap, jid)
    w = weights(snap, jid)
    ks = [k for k in w if w[k] > 0]
    sw = sum(w.values()) or 1
    def flabel(k):
        return FACTOR_LABELS.get(k) or snap.dim_label(k)
    buf = io.StringIO()
    out = csv.writer(buf)
    out.writerow(["Crew Board score record"])
    out.writerow(["Job", job.title])
    out.writerow(["Run at", business_today(ctx.tenant).isoformat()])
    out.writerow(["Run by", ctx.membership.display_name])
    out.writerow(["Label", label_for(snap, jid)])
    out.writerow([])
    out.writerow(["Crew", "Can take it", "Rules failed", *[f"{flabel(k)} value" for k in ks], *[f"{flabel(k)} weight" for k in ks],
                  *[f"{flabel(k)} points" for k in ks], "Score"])
    for r in rows:
        out.writerow([L.crew_names[r.crew], "Yes" if r.ok else "No", "; ".join(f.message for f in r.fails),
                      *[r.f.get(k, "") for k in ks], *[_num(w[k]) for k in ks],
                      *[f"{w[k] * r.f[k] / sw:.1f}" if r.f.get(k) is not None else "" for k in ks], r.score])
    out.writerow([])
    out.writerow([INPUTS_NOTE])
    name = job.title.lower().replace(" ", "-")
    return PlainTextResponse(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="crewboard-score-{name}.csv"'})


# ---------- weather (CAL-04) ----------

@router.get("/weather", operation_id="weather_get")
async def weather(from_: date | None = Query(None, alias="from"), to: date | None = None, area_id: uuid.UUID | None = None, ctx: Ctx = Depends(tenant_ctx)):
    """Rain probability by day for the workspace (or one service area). Days with no cached forecast are null."""
    today = business_today(ctx.tenant)
    frm, until = from_ or today, to or today + timedelta(days=27)
    if until < frm or (until - frm).days > 60:
        raise AppError(422, "validation_failed", "Pick a range of up to 60 days")
    if area_id:
        if not await ctx.session.get(ServiceArea, area_id):
            raise not_found("Service area")
        cell = await area_cell(ctx.session, area_id)
    else:
        cell = await workspace_cell(ctx.session)
    rows = {w.day: w for w in (await ctx.session.execute(select(WeatherDay).where(WeatherDay.cell == cell, WeatherDay.day >= frm,
                                                                                    WeatherDay.day <= until))).scalars()}
    return {"cell": cell, "source": next((w.source for w in rows.values()), None),
            "days": [{"date": frm + timedelta(days=i), "rain": rows[frm + timedelta(days=i)].rain_probability if frm + timedelta(days=i) in rows else None}
                     for i in range((until - frm).days + 1)]}


# ---------- job list (Q-01) ----------

@router.get("/jobs", operation_id="jobs_list")
async def jobs(queue: bool | None = None, q: str | None = None, status: str = "open", limit: int = 100, ctx: Ctx = Depends(tenant_ctx)):
    """Jobs with their client, area and calendar state. `queue=true` is the Ready to schedule order; /queue adds ranking."""
    s = ctx.session
    stmt = select(Job).where(Job.status == status).limit(min(limit, 500))
    if queue is True:
        stmt = stmt.where(Job.queue_position.is_not(None)).order_by(Job.queue_position)
    elif queue is False:
        stmt = stmt.where(Job.queue_position.is_(None)).order_by(Job.created_at.desc())
    else:
        stmt = stmt.order_by(Job.queue_position.nulls_last(), Job.created_at.desc())
    if q:
        stmt = stmt.where(Job.title.ilike(f"%{q}%"))
    rows = (await s.execute(stmt)).scalars().all()
    clients = {c.id: c.name for c in (await s.execute(select(Client).where(Client.id.in_([j.client_id for j in rows if j.client_id])))).scalars()}
    areas = {a.id: a.name for a in (await s.execute(select(ServiceArea))).scalars()}
    places = {p.job_id: p.status for p in (await s.execute(select(Placement).where(Placement.job_id.in_([j.id for j in rows])))).scalars()}
    return {"items": [{"id": j.id, "title": j.title, "client_id": j.client_id, "client": clients.get(j.client_id), "area": areas.get(j.service_area_id),
                       "price": float(j.price) if j.price is not None else None, "sold_hours": float(j.sold_hours), "earliest_start": j.earliest_start,
                       "finish_by": j.finish_by, "queue_position": j.queue_position, "placement_status": places.get(j.id), "status": j.status,
                       "version": j.version} for j in rows]}
