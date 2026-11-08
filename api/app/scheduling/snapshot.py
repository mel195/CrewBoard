"""Build an engine Snapshot from the database for one tenant (one read, consistent).

Mapping rules (Phase 2 DD-03, DD-07):
- Day index 0 = the tenant's business "today" (calendar_anchor for demo tenants), 42 days.
- Jobs in the queue (queue_position set) are engine queue jobs; their placements are engine placements.
- Scheduled placements of jobs that are not in the queue are engine fixed bookings (confirmed work the
  optimizer may shift by a day or two, like the prototype's BOOKS).
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from geoalchemy2.shape import to_shape
from sqlalchemy import select

from app.assistant.models import AssistantHabit
from app.clients.models import ClientSignal
from app.core.context import Ctx
from app.crews.models import Crew, CrewCostPeriod, CrewHours, CrewRating
from app.geo.models import Region, ServiceArea
from app.jobs.models import Job, JobRanking, JobSkill
from app.scheduling.engine import model as m
from app.scheduling.models import Placement, PlacementCrew, PlacementVisit
from app.settings.models import (DefaultHours, ImportantTrigger, RankingLabel, RankingLabelWeight, RatingDimension,
                                 SchedulingRules)
from app.trades.painting.models import PaintingJob
from app.weather.models import WeatherDay
from app.weather.service import workspace_cell

DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
LANGS = {"en": "English", "es": "Spanish", "ht": "Haitian Creole", "pt": "Portuguese"}
AVG_COST_DEFAULT = 152   # company average crew pay per sold painter day (prototype AVG_COST; DD-14)
CALENDAR_DAYS = 42


def business_today(tenant) -> date:
    if tenant.calendar_anchor:
        return tenant.calendar_anchor
    return datetime.now(ZoneInfo(tenant.time_zone)).date()


def _num(v):
    """Decimal rating -> int when whole (prints like the prototype: 3, not 3.0), else float."""
    if v is None:
        return None
    f = float(v)
    return int(f) if f.is_integer() else f


def _hm(t: time | None) -> str | None:
    return t.strftime("%H:%M") if t else None


def _hours(rows) -> m.Hours:
    by = {r.day_kind: (_hm(r.start_time), _hm(r.end_time)) if r.start_time else None for r in rows}
    return m.Hours(wk=by.get("weekday"), sat=by.get("saturday"), sun=by.get("sunday"))


@dataclass
class LoadedSnapshot:
    snap: m.Snapshot
    anchor: date
    crew_names: dict[str, str] = field(default_factory=dict)
    area_names: dict[str, str] = field(default_factory=dict)
    label_ids: dict[str, uuid.UUID] = field(default_factory=dict)
    rules: SchedulingRules | None = None

    def index(self, d: date) -> int:
        return (d - self.anchor).days

    def date(self, i: int) -> date:
        return self.anchor + timedelta(days=i)


async def load_snapshot(ctx: Ctx) -> LoadedSnapshot:
    s = ctx.session
    tenant = ctx.tenant
    anchor = business_today(tenant)
    days = [m.Day(iso=(d := anchor + timedelta(days=i)).isoformat(), dow=DOW[d.weekday()], m=MON[d.month - 1], n=d.day)
            for i in range(CALENDAR_DAYS)]
    idx = lambda d: (d - anchor).days

    rules = (await s.execute(select(SchedulingRules))).scalar_one()
    dims = (await s.execute(select(RatingDimension).order_by(RatingDimension.sort_order))).scalars().all()
    dim_key = {d.id: d.key for d in dims}
    kind_map = {"job_type": "job", "skill": "skill", "attribute": "attr"}

    regions = {r.id: r.name for r in (await s.execute(select(Region))).scalars()}
    areas = (await s.execute(select(ServiceArea))).scalars().all()
    geo = {}
    for a in areas:
        pt = to_shape(a.location)
        geo[str(a.id)] = (pt.y, pt.x)

    crews = (await s.execute(select(Crew).where(Crew.archived_at.is_(None)).order_by(Crew.sort_order, Crew.name))).scalars().all()
    ratings = defaultdict(list)
    for r in (await s.execute(select(CrewRating))).scalars():
        ratings[r.crew_id].append(r)
    hours = defaultdict(list)
    for h in (await s.execute(select(CrewHours))).scalars():
        hours[h.crew_id].append(h)
    hist: dict[str, dict] = {}
    for c in (await s.execute(select(CrewCostPeriod))).scalars():
        h = hist.setdefault(str(c.crew_id), {"sold": 0.0, "actual": 0.0, "pay": 0.0})
        h["sold"] += float(c.sold_hours)
        h["actual"] += float(c.actual_hours)
        h["pay"] += float(c.crew_pay)
    eng_crews = []
    for c in crews:
        rs = ratings[c.id]
        eng_crews.append(m.Crew(
            id=str(c.id), name=c.name, status=c.status, size=(c.size_min, c.size_max) if c.size_min else None,
            base=str(c.base_area_id) if c.base_area_id else None, region=regions.get(c.region_id),
            languages=c.languages or "", lead_safe=c.lead_safe_certified, hours=_hours(hours[c.id]) if hours[c.id] else None,
            ratings={dim_key[r.dimension_id]: _num(r.value) for r in rs},
            review_counts={dim_key[r.dimension_id]: r.review_count for r in rs if r.review_count},
            rating_sources={dim_key[r.dimension_id]: r.source for r in rs if r.source == "admin"},
        ))

    jobs = (await s.execute(select(Job).where(Job.status == "open"))).scalars().all()
    painting = {p.job_id: p for p in (await s.execute(select(PaintingJob))).scalars()}
    skills = defaultdict(list)
    for js in (await s.execute(select(JobSkill).order_by(JobSkill.sort_order))).scalars():
        skills[js.job_id].append(dim_key[js.dimension_id])
    signals = {cs.client_id: cs for cs in (await s.execute(select(ClientSignal))).scalars()}

    def eng_job(j: Job) -> m.Job:
        p = painting.get(j.id)
        sig = {}
        cs = signals.get(j.client_id)
        if cs:
            if cs.returning_since:
                sig["returning"] = cs.returning_since
            if cs.referral_count:
                sig["referrals"] = cs.referral_count
            if cs.crm_vip:
                sig["crm"] = True
            if cs.trade_type:
                sig["trade"] = cs.trade_type
        if j.important_note:
            sig["manual"] = j.important_note
        return m.Job(id=str(j.id), title=j.title, area=str(j.service_area_id), type=dim_key[j.job_type_id], hours=float(j.sold_hours),
                     earliest=idx(j.earliest_start), deadline=idx(j.finish_by), value=float(j.price or 0), region=regions.get(j.region_id),
                     ext=bool(p and p.is_exterior), built=p.year_built if p else None, lang=j.language, skills=skills[j.id], signals=sig)

    queue_jobs = sorted([j for j in jobs if j.queue_position is not None], key=lambda j: j.queue_position)
    all_jobs = {j.id: j for j in jobs}

    placements = (await s.execute(select(Placement))).scalars().all()
    pcrews = defaultdict(list)
    for pc in (await s.execute(select(PlacementCrew))).scalars():
        pcrews[pc.placement_id].append(pc)
    visits = defaultdict(list)
    for v in (await s.execute(select(PlacementVisit).order_by(PlacementVisit.seq))).scalars():
        visits[v.placement_id].append(v)
    dim_label = {d.key: d.label for d in dims}

    place: dict[str, m.Placement] = {}
    fixed: list[m.FixedBooking] = []
    for p in placements:
        j = all_jobs.get(p.job_id)
        if not j or not visits[p.id] or not pcrews[p.id]:
            continue
        lead = next(str(c.crew_id) for c in pcrews[p.id] if c.role == "lead")
        extra = [str(c.crew_id) for c in pcrews[p.id] if c.role == "extra"]
        segs = [[idx(v.start_date), idx(v.end_date)] for v in visits[p.id]]
        if j.queue_position is not None:
            place[str(j.id)] = m.Placement(crew=lead, extra=extra, segs=segs, status=p.status, half=p.half_day,
                                           by="Optimizer recommended" if p.recommended_by == "optimizer" else None,
                                           by_crew=str(p.recommended_crew_id) if p.recommended_crew_id else None)
        elif p.status == "scheduled":
            what = dim_label.get(dim_key[j.job_type_id], "").split(" ")[0]
            fixed.append(m.FixedBooking(id=str(p.id), crew=lead, name=j.title, what=what, s=segs[0][0], e=segs[0][1],
                                        value=float(j.price or 0), half=p.half_day))
    fixed.sort(key=lambda b: (b.crew, b.s))

    labels = (await s.execute(select(RankingLabel).order_by(RankingLabel.sort_order))).scalars().all()
    weights = defaultdict(dict)
    for w in (await s.execute(select(RankingLabelWeight).order_by(RankingLabelWeight.sort_order))).scalars():
        weights[w.label_id][w.factor_key] = float(w.weight)
    label_names = {l.id: l.name for l in labels}
    jr = (await s.execute(select(JobRanking))).scalars().all()

    wx_cell = await workspace_cell(s)
    rain = [0] * 28
    if wx_cell:
        for w in (await s.execute(select(WeatherDay).where(WeatherDay.cell == wx_cell, WeatherDay.day >= anchor,
                                                           WeatherDay.day < anchor + timedelta(days=28)))).scalars():
            rain[idx(w.day)] = w.rain_probability

    dh = (await s.execute(select(DefaultHours))).scalars().all()
    habits = (await s.execute(select(AssistantHabit).order_by(AssistantHabit.sort_order))).scalars().all()
    triggers = {t.key: t.enabled for t in (await s.execute(select(ImportantTrigger))).scalars()}

    snap = m.Snapshot(
        days=days, crews=eng_crews, jobs={str(j.id): eng_job(j) for j in queue_jobs}, queue=[str(j.id) for j in queue_jobs],
        fixed=fixed, place=place, shift={}, reassign={},
        rules=m.Rules(min_type=rules.min_type_rating, lead=rules.lead_rule, imp=rules.important_rule, imp_bar=rules.important_bar,
                      weather=rules.weather_rule, max_drive=rules.max_drive_min, untested=rules.allow_unrated, region=rules.region_rule,
                      min_reviews=rules.min_reviews),
        imp_on=triggers, imp_value=float(rules.important_value),
        hours_default=_hours(dh) if dh else m.Hours(),
        labels={l.name: weights[l.id] for l in labels},
        job_label={str(r.job_id): label_names[r.label_id] for r in jr if r.label_id in label_names},
        job_weights={str(r.job_id): r.custom_weights for r in jr if r.custom_weights},
        dims=[m.Dimension(k=d.key, label=d.label, group=kind_map[d.kind]) for d in dims],
        rain_prob=rain, geo=geo, hist=hist, avg_cost=AVG_COST_DEFAULT, langs=LANGS,
        lead_tracked=rules.lead_safe_tracked, lang_tracked=rules.languages_tracked,
        habits=[m.Habit(id=str(h.id), text=h.text, status=h.status, crew=str(h.prefer_crew_id) if h.prefer_crew_id else None,
                        avoid=str(h.avoid_crew_id) if h.avoid_crew_id else None, n=h.evidence_count, condition=h.condition) for h in habits],
        lock=rules.lock_days, rain_threshold=rules.rain_threshold,
        slot_horizon=rules.slot_horizon_days - 1, span_horizon=rules.span_horizon_days - 1,
    )
    return LoadedSnapshot(snap=snap, anchor=anchor, crew_names={c.id: c.name for c in eng_crews},
                          area_names={str(a.id): a.name for a in areas}, label_ids={l.name: l.id for l in labels}, rules=rules)
