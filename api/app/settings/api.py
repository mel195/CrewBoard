"""Setup: rules, important-client triggers, ranking labels, rating dimensions, job labels, default hours (SET-01 to SET-07)."""
from __future__ import annotations

import uuid
from datetime import time

from fastapi import APIRouter, Depends, Header, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import delete, select, update

from app.audit.service import record
from app.core.context import Ctx, check_version, require, tenant_ctx
from app.core.errors import AppError, not_found
from app.crews.models import Crew, CrewHours
from app.jobs.models import JobRanking

from .models import (DefaultHours, ImportantTrigger, JobLabel, RankingLabel, RankingLabelWeight, RatingDimension,
                     SchedulingRules)

router = APIRouter(tags=["settings"])


# ---------- rules (SET-01, SET-02, OPT-02) ----------

class RulesBody(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    weather_rule: bool
    lead_rule: bool
    important_rule: bool
    important_bar: int = Field(ge=1, le=5)
    region_rule: bool
    max_drive_min: int = Field(ge=15, le=90)
    min_type_rating: int = Field(ge=1, le=5)
    min_reviews: int = Field(ge=1, le=10)
    allow_unrated: bool
    review_before_send: bool
    lock_days: int = Field(ge=3, le=7)
    important_value: float = Field(ge=0)
    open_day_value: float = Field(ge=0)
    riley_autobook_limit: float = Field(ge=0)
    rain_threshold: int = Field(ge=0, le=100)


class RulesOut(RulesBody):
    version: int


@router.get("/settings/rules", response_model=RulesOut, operation_id="settings_rules_get")
async def get_rules(response: Response, ctx: Ctx = Depends(tenant_ctx)):
    r = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    response.headers["ETag"] = f'"{r.version}"'
    return RulesOut.model_validate(r)


@router.put("/settings/rules", response_model=RulesOut, operation_id="settings_rules_put")
async def put_rules(body: RulesBody, response: Response, if_match: str | None = Header(None), ctx: Ctx = Depends(require("admin"))):
    r = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    check_version(r.version, if_match)
    changes = {k: [str(getattr(r, k)), str(v)] for k, v in body.model_dump().items() if str(getattr(r, k)) != str(v)}
    for k, v in body.model_dump().items():
        setattr(r, k, v)
    r.version += 1
    if changes:
        await record(ctx, "Setting", "Changed scheduling rules: " + ", ".join(f"{k} {a} → {b}" for k, (a, b) in changes.items()) + ".",
                     entity_type="scheduling_rules", entity_id=r.id, detail=changes)
    response.headers["ETag"] = f'"{r.version}"'
    return RulesOut.model_validate(r)


# ---------- important-client triggers (SET-05) ----------

class TriggerOut(BaseModel):
    key: str
    enabled: bool


@router.get("/settings/important-triggers", response_model=list[TriggerOut], operation_id="settings_triggers_get")
async def get_triggers(ctx: Ctx = Depends(tenant_ctx)):
    return [TriggerOut(key=t.key, enabled=t.enabled) for t in (await ctx.session.execute(select(ImportantTrigger).order_by(ImportantTrigger.key))).scalars()]


@router.put("/settings/important-triggers", response_model=list[TriggerOut], operation_id="settings_triggers_put")
async def put_triggers(body: list[TriggerOut], ctx: Ctx = Depends(require("admin"))):
    current = {t.key: t for t in (await ctx.session.execute(select(ImportantTrigger))).scalars()}
    for t in body:
        if t.key not in current:
            raise AppError(422, "validation_failed", f"Unknown trigger {t.key}")
        if current[t.key].enabled != t.enabled:
            current[t.key].enabled = t.enabled
            await record(ctx, "Setting", f"{'Turned on' if t.enabled else 'Turned off'} the important-client trigger: {t.key}.")
    return [TriggerOut(key=k, enabled=v.enabled) for k, v in sorted(current.items())]


# ---------- rating dimensions ----------

class DimensionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    key: str
    label: str
    kind: str
    trade: str | None


@router.get("/rating-dimensions", response_model=list[DimensionOut], operation_id="rating_dimensions_list")
async def dimensions(ctx: Ctx = Depends(tenant_ctx)):
    return (await ctx.session.execute(select(RatingDimension).order_by(RatingDimension.sort_order))).scalars().all()


# ---------- ranking labels (SET-03, MAT-05) ----------

class LabelIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    description: str = ""
    weights: dict[str, float]

    @field_validator("weights")
    @classmethod
    def _range(cls, w):
        if any(v < 0 or v > 5 for v in w.values()):
            raise ValueError("weights must be between 0 and 5")
        return w


class LabelOut(LabelIn):
    id: uuid.UUID
    is_default: bool
    is_default_important: bool
    version: int


async def _label_out(ctx: Ctx, l: RankingLabel) -> LabelOut:
    ws = (await ctx.session.execute(select(RankingLabelWeight).where(RankingLabelWeight.label_id == l.id).order_by(RankingLabelWeight.sort_order))).scalars()
    return LabelOut(id=l.id, name=l.name, description=l.description, weights={w.factor_key: float(w.weight) for w in ws},
                    is_default=l.is_default, is_default_important=l.is_default_important, version=l.version)


async def _set_weights(ctx: Ctx, label: RankingLabel, weights: dict[str, float]) -> None:
    await ctx.session.execute(delete(RankingLabelWeight).where(RankingLabelWeight.label_id == label.id))
    for i, (k, v) in enumerate(weights.items()):
        if v > 0:
            ctx.session.add(RankingLabelWeight(tenant_id=ctx.tenant_id, label_id=label.id, factor_key=k, weight=v, sort_order=i))


@router.get("/ranking-labels", response_model=list[LabelOut], operation_id="ranking_labels_list")
async def labels(ctx: Ctx = Depends(tenant_ctx)):
    ls = (await ctx.session.execute(select(RankingLabel).order_by(RankingLabel.sort_order))).scalars().all()
    return [await _label_out(ctx, l) for l in ls]


@router.post("/ranking-labels", response_model=LabelOut, status_code=201, operation_id="ranking_labels_create")
async def create_label(body: LabelIn, ctx: Ctx = Depends(require("admin"))):
    if (await ctx.session.execute(select(RankingLabel).where(RankingLabel.name == body.name))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That name is taken")
    n = len((await ctx.session.execute(select(RankingLabel))).scalars().all())
    l = RankingLabel(tenant_id=ctx.tenant_id, name=body.name, description=body.description, sort_order=n)
    ctx.session.add(l)
    await ctx.session.flush()
    await _set_weights(ctx, l, body.weights)
    await record(ctx, "Setting", f"Added the ranking label “{body.name}”.", entity_type="ranking_label", entity_id=l.id)
    await ctx.session.flush()
    return await _label_out(ctx, l)


@router.patch("/ranking-labels/{label_id}", response_model=LabelOut, operation_id="ranking_labels_update")
async def update_label(label_id: uuid.UUID, body: LabelIn, if_match: str | None = Header(None), ctx: Ctx = Depends(require("admin"))):
    l = await ctx.session.get(RankingLabel, label_id)
    if not l:
        raise not_found("Label")
    check_version(l.version, if_match)
    if body.name != l.name and (await ctx.session.execute(select(RankingLabel).where(RankingLabel.name == body.name))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That name is taken")
    l.name, l.description = body.name, body.description
    l.version += 1
    await _set_weights(ctx, l, body.weights)
    await record(ctx, "Setting", f"Edited the ranking label “{l.name}”.", entity_type="ranking_label", entity_id=l.id, detail={"weights": body.weights})
    await ctx.session.flush()
    return await _label_out(ctx, l)


@router.delete("/ranking-labels/{label_id}", status_code=204, operation_id="ranking_labels_delete")
async def delete_label(label_id: uuid.UUID, ctx: Ctx = Depends(require("admin"))):
    l = await ctx.session.get(RankingLabel, label_id)
    if not l:
        raise not_found("Label")
    if len((await ctx.session.execute(select(RankingLabel))).scalars().all()) < 2:
        raise AppError(422, "last_label", "Keep at least one label")
    # Jobs that used it go back to their default label (prototype behavior)
    await ctx.session.execute(update(JobRanking).where(JobRanking.label_id == l.id).values(label_id=None))
    await ctx.session.delete(l)
    await record(ctx, "Setting", f"Deleted the ranking label “{l.name}”.", entity_type="ranking_label", entity_id=l.id)


# ---------- job labels (SET-04) ----------

class JobLabelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class JobLabelIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)


@router.get("/job-labels", response_model=list[JobLabelOut], operation_id="job_labels_list")
async def job_labels(ctx: Ctx = Depends(tenant_ctx)):
    return (await ctx.session.execute(select(JobLabel).order_by(JobLabel.name))).scalars().all()


@router.post("/job-labels", response_model=JobLabelOut, status_code=201, operation_id="job_labels_create")
async def add_job_label(body: JobLabelIn, ctx: Ctx = Depends(require("admin"))):
    if (await ctx.session.execute(select(JobLabel).where(JobLabel.name == body.name))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That label exists")
    jl = JobLabel(tenant_id=ctx.tenant_id, name=body.name)
    ctx.session.add(jl)
    await ctx.session.flush()
    await record(ctx, "Setting", f"Added the job label “{body.name}”.")
    return jl


@router.delete("/job-labels/{label_id}", status_code=204, operation_id="job_labels_delete")
async def delete_job_label(label_id: uuid.UUID, ctx: Ctx = Depends(require("admin"))):
    jl = await ctx.session.get(JobLabel, label_id)
    if not jl:
        raise not_found("Job label")
    await ctx.session.delete(jl)
    await record(ctx, "Setting", f"Removed the job label “{jl.name}”.")


# ---------- default hours (SET-07) ----------

class DayHours(BaseModel):
    start: time
    end: time

    @field_validator("end")
    @classmethod
    def _order(cls, v, info):
        if "start" in info.data and v <= info.data["start"]:
            raise ValueError("end must be after start")
        return v


class HoursBody(BaseModel):
    weekday: DayHours | None
    saturday: DayHours | None
    sunday: DayHours | None


def _hours_out(rows) -> HoursBody:
    by = {r.day_kind: DayHours(start=r.start_time, end=r.end_time) if r.start_time else None for r in rows}
    return HoursBody(weekday=by.get("weekday"), saturday=by.get("saturday"), sunday=by.get("sunday"))


@router.get("/settings/default-hours", response_model=HoursBody, operation_id="settings_hours_get")
async def get_hours(ctx: Ctx = Depends(tenant_ctx)):
    return _hours_out((await ctx.session.execute(select(DefaultHours))).scalars().all())


@router.put("/settings/default-hours", response_model=HoursBody, operation_id="settings_hours_put")
async def put_hours(body: HoursBody, ctx: Ctx = Depends(require("admin"))):
    rows = {r.day_kind: r for r in (await ctx.session.execute(select(DefaultHours))).scalars()}
    for kind in ("weekday", "saturday", "sunday"):
        v: DayHours | None = getattr(body, kind)
        r = rows.get(kind) or DefaultHours(tenant_id=ctx.tenant_id, day_kind=kind)
        r.start_time, r.end_time = (v.start, v.end) if v else (None, None)
        ctx.session.add(r)
    await record(ctx, "Setting", "Changed default working hours.", detail=body.model_dump(mode="json"))
    return body


@router.post("/settings/default-hours/apply-to-all-crews", status_code=204, operation_id="settings_hours_apply_all")
async def apply_hours(ctx: Ctx = Depends(require("admin"))):
    rows = (await ctx.session.execute(select(DefaultHours))).scalars().all()
    crews = (await ctx.session.execute(select(Crew).where(Crew.archived_at.is_(None)))).scalars().all()
    await ctx.session.execute(delete(CrewHours))
    for c in crews:
        for r in rows:
            ctx.session.add(CrewHours(tenant_id=ctx.tenant_id, crew_id=c.id, day_kind=r.day_kind, start_time=r.start_time, end_time=r.end_time))
    await record(ctx, "Crew data", "Applied the default working hours to all crews.")
