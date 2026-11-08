"""How a score was worked out, rain by day, and the job list (MAT-08, CAL-04, Q-01)."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select

from app.clients.models import Client
from app.core.context import Ctx, tenant_ctx
from app.core.errors import AppError, not_found
from app.geo.models import ServiceArea
from app.jobs.models import Job
from app.scheduling.models import Placement
from app.weather.models import WeatherDay

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
    never = [{"factor": k, "label": flabel(k), "value": r.f.get(k), "why": f"Weight 0 in “{label_for(snap, jid)}”"}
             for k in r.f if k not in used]
    return {"job_id": job_id, "job_title": job.title, "crew_id": uuid.UUID(r.crew), "crew_name": L.crew_names[r.crew], "label": label_for(snap, jid),
            "custom_weights": jid in snap.job_weights, "score": r.score, "passes": r.ok,
            "formula": "Score = sum of (factor value × weight) ÷ sum of weights, rounded. Factors run 0 to 100.",
            "rule_checks": checks, "factor_table": table, "never_used": never}


@router.get("/jobs/{job_id}/ranking/explanation", operation_id="jobs_ranking_explanation")
async def explanation(job_id: uuid.UUID, crew_id: uuid.UUID | None = None, ctx: Ctx = Depends(tenant_ctx)):
    """For one crew (the top crew by default): every rule check, each factor with its weight and points, and the factors not counted."""
    return await _explain(ctx, job_id, crew_id)


@router.get("/jobs/{job_id}/ranking/explanation.csv", response_class=PlainTextResponse, operation_id="jobs_ranking_explanation_csv")
async def explanation_csv(job_id: uuid.UUID, crew_id: uuid.UUID | None = None, ctx: Ctx = Depends(tenant_ctx)):
    e = await _explain(ctx, job_id, crew_id)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Job", e["job_title"], "Crew", e["crew_name"], "Label", e["label"], "Score", e["score"]])
    w.writerow([])
    w.writerow(["Rule", "Applies", "Passed", "Detail"])
    for c in e["rule_checks"]:
        w.writerow([c["rule"], "Yes" if c["applies"] else "No", "Yes" if c["passed"] else "No", c["detail"] or ""])
    w.writerow([])
    w.writerow(["Factor", "Value (0-100)", "Weight", "Share %", "Points"])
    for f in e["factor_table"]:
        w.writerow([f["label"], f["value"], f["weight"], f["share_pct"], f["points"]])
    for f in e["never_used"]:
        w.writerow([f["label"], f["value"], 0, 0, 0])
    name = e["job_title"].lower().replace(" ", "-")
    return PlainTextResponse(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="score-{name}.csv"'})


# ---------- weather (CAL-04) ----------

def geohash(lat: float, lon: float, precision: int = 5) -> str:
    alphabet = "0123456789bcdefghjkmnpqrstuvwxyz"
    lat_r, lon_r, out, bits, ch, even = [-90.0, 90.0], [-180.0, 180.0], [], 0, 0, True
    while len(out) < precision:
        rng, v = (lon_r, lon) if even else (lat_r, lat)
        mid = (rng[0] + rng[1]) / 2
        if v >= mid:
            ch, rng[0] = ch * 2 + 1, mid
        else:
            ch, rng[1] = ch * 2, mid
        even, bits = not even, bits + 1
        if bits == 5:
            out.append(alphabet[ch])
            bits = ch = 0
    return "".join(out)


@router.get("/weather", operation_id="weather_get")
async def weather(from_: date | None = Query(None, alias="from"), to: date | None = None, area_id: uuid.UUID | None = None, ctx: Ctx = Depends(tenant_ctx)):
    """Rain probability by day. Demo workspaces use the prototype's sample forecast; others read the cached forecast for the area."""
    today = business_today(ctx.tenant)
    frm, until = from_ or today, to or today + timedelta(days=27)
    if until < frm or (until - frm).days > 60:
        raise AppError(422, "validation_failed", "Pick a range of up to 60 days")
    if ctx.tenant.is_demo:
        cell = "demo"
    else:
        if not area_id:
            raise AppError(422, "validation_failed", "Pass area_id")
        a = (await ctx.session.execute(select(func.ST_Y(func.ST_GeomFromWKB(func.ST_AsBinary(ServiceArea.location))),
                                              func.ST_X(func.ST_GeomFromWKB(func.ST_AsBinary(ServiceArea.location))))
                                       .where(ServiceArea.id == area_id))).first()
        if not a:
            raise not_found("Service area")
        cell = geohash(a[0], a[1])
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
