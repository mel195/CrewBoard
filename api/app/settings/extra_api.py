"""Recommended crew fields, saved calendar views, project manager and rating dimension edits (SET-06, CAL-08, BRD-07)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select

from app.audit.service import record
from app.core.context import Ctx, require, tenant_ctx
from app.core.errors import AppError, not_found

from .api import DimensionOut
from .models import CalendarView, CrewFieldSetting, ProjectManager, RatingDimension, SchedulingRules

router = APIRouter(tags=["settings"])

# Prototype RECOMMENDED (+ the v5 additions): key, label, why, what it's used for, tier, on by default
CREW_FIELDS = [
    ("languages", "Languages", "Match clients who prefer Spanish or Creole", "factor", "rec", True),
    ("lead_safe", "Lead-safe (RRP) certified", "Required by law on homes built before 1978", "rule", "rec", True),
    ("channel", "How to reach the crew lead", "WhatsApp, text or email, and their language", "info", "rec", True),
    ("pay", "Pay model and rate", "Suggest crew pay and track cost per painter day", "info", "rec", False),
    ("insurance", "Insurance expiry", "Stop booking crews with lapsed insurance", "rule", "rec", False),
    ("equipment", "Equipment (lift, sprayer rig)", "Two-story and spray jobs", "rule", "nice", False),
    ("max_drive", "Furthest they will drive", "Respect each crew’s service area", "rule", "nice", False),
    ("max_jobs_day", "Jobs per day they can take", "Small jobs and touch-ups across the day", "rule", "nice", False),
    ("photo", "Crew photo", "Helps clients recognize who’s at the door", "info", "nice", False),
]
FIELD_KEYS = {f[0] for f in CREW_FIELDS}


class CrewFieldOut(BaseModel):
    key: str
    label: str
    why: str
    use: str
    tier: str
    enabled: bool


class CrewFieldIn(BaseModel):
    key: str
    enabled: bool


async def _fields(ctx: Ctx) -> list[CrewFieldOut]:
    rows = {r.field_key: r.enabled for r in (await ctx.session.execute(select(CrewFieldSetting))).scalars()}
    rules = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    tracked = {"lead_safe": rules.lead_safe_tracked, "languages": rules.languages_tracked}   # the engine reads these two
    return [CrewFieldOut(key=k, label=l, why=w, use=u, tier=t, enabled=tracked.get(k, rows.get(k, d))) for k, l, w, u, t, d in CREW_FIELDS]


@router.get("/settings/crew-fields", response_model=list[CrewFieldOut], operation_id="settings_crew_fields_get")
async def get_fields(ctx: Ctx = Depends(tenant_ctx)):
    return await _fields(ctx)


@router.put("/settings/crew-fields", response_model=list[CrewFieldOut], operation_id="settings_crew_fields_put")
async def put_fields(body: list[CrewFieldIn], ctx: Ctx = Depends(require("admin"))):
    """Turning off lead-safe also turns off the lead-safe rule, as in the prototype (G-19). Turning it back on leaves the rule off."""
    rows = {r.field_key: r for r in (await ctx.session.execute(select(CrewFieldSetting))).scalars()}
    rules = (await ctx.session.execute(select(SchedulingRules))).scalar_one()
    current = {f.key: f.enabled for f in await _fields(ctx)}
    label = {f[0]: f[1] for f in CREW_FIELDS}
    for f in body:
        if f.key not in FIELD_KEYS:
            raise AppError(422, "validation_failed", f"Unknown crew field {f.key}")
        if current[f.key] == f.enabled:
            continue
        r = rows.get(f.key) or CrewFieldSetting(tenant_id=ctx.tenant_id, field_key=f.key)
        r.enabled = f.enabled
        ctx.session.add(r)
        if f.key == "lead_safe":
            rules.lead_safe_tracked = f.enabled
            if not f.enabled and rules.lead_rule:
                rules.lead_rule = False
                await record(ctx, "Setting", "Turned off the lead-safe rule because lead-safe isn't tracked any more.")
            rules.version += 1
        if f.key == "languages":
            rules.languages_tracked = f.enabled
            rules.version += 1
        await record(ctx, "Setting", f"{'Added' if f.enabled else 'Removed'} the crew field “{label[f.key]}”.")
    await ctx.session.flush()
    return await _fields(ctx)


# ---------- saved calendar views (CAL-08) ----------

class ViewIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    config: dict   # view, show, group, region, group_by
    shared: bool = True


class ViewOut(BaseModel):
    id: uuid.UUID
    name: str
    config: dict
    shared: bool
    mine: bool


def _view(v: CalendarView, ctx: Ctx) -> ViewOut:
    return ViewOut(id=v.id, name=v.name, config=v.config, shared=v.owner_membership_id is None,
                   mine=v.owner_membership_id in (None, ctx.membership.id))


@router.get("/calendar-views", response_model=list[ViewOut], operation_id="calendar_views_list")
async def views(ctx: Ctx = Depends(tenant_ctx)):
    rows = (await ctx.session.execute(select(CalendarView).where(or_(CalendarView.owner_membership_id.is_(None),
                                                                     CalendarView.owner_membership_id == ctx.membership.id))
                                      .order_by(CalendarView.name))).scalars()
    return [_view(v, ctx) for v in rows]


@router.post("/calendar-views", response_model=ViewOut, status_code=201, operation_id="calendar_views_create")
async def add_view(body: ViewIn, ctx: Ctx = Depends(tenant_ctx)):
    allowed = {"view", "show", "group", "region", "group_by", "days", "crews"}
    if set(body.config) - allowed:
        raise AppError(422, "validation_failed", f"Unknown view settings: {', '.join(sorted(set(body.config) - allowed))}")
    if (await ctx.session.execute(select(CalendarView).where(func.lower(CalendarView.name) == body.name.lower()))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That name is taken")
    v = CalendarView(tenant_id=ctx.tenant_id, name=body.name, config=body.config, owner_membership_id=None if body.shared else ctx.membership.id)
    ctx.session.add(v)
    await ctx.session.flush()
    return _view(v, ctx)


@router.delete("/calendar-views/{view_id}", status_code=204, operation_id="calendar_views_delete")
async def delete_view(view_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    """Your own views, or any shared view (shared views belong to everyone, as in the prototype)."""
    v = await ctx.session.get(CalendarView, view_id)
    if not v or v.owner_membership_id not in (None, ctx.membership.id):
        raise not_found("View")
    await ctx.session.delete(v)


# ---------- edits ----------

class PmPatch(BaseModel):
    name: str | None = Field(None, min_length=1)
    phone: str | None = None
    email: str | None = None
    channel: str | None = Field(None, pattern="^(text|email|whatsapp)$")
    language: str | None = Field(None, pattern="^(en|es|pt|ht)$")


@router.patch("/project-managers/{pm_id}", operation_id="project_managers_update")
async def edit_pm(pm_id: uuid.UUID, body: PmPatch, ctx: Ctx = Depends(require("admin"))):
    p = await ctx.session.get(ProjectManager, pm_id)
    if not p:
        raise not_found("Project manager")
    ch = body.model_dump(exclude_unset=True)
    if "name" in ch and ch["name"] != p.name and (await ctx.session.execute(select(ProjectManager).where(ProjectManager.name == ch["name"]))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That name is taken")
    for k, v in ch.items():
        setattr(p, k, v)
    if ch:
        await record(ctx, "Setting", f"Updated project manager {p.name}: {', '.join(ch)}.")
    return {"id": p.id, "name": p.name, "phone": p.phone, "email": p.email, "channel": p.channel, "language": p.language}


class DimPatch(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=40)
    sort_order: int | None = Field(None, ge=0)


@router.patch("/rating-dimensions/{dim_id}", response_model=DimensionOut, operation_id="rating_dimensions_update")
async def edit_dim(dim_id: uuid.UUID, body: DimPatch, ctx: Ctx = Depends(require("admin"))):
    """Rename or reorder. The key and kind stay: ratings, jobs and label weights refer to them."""
    d = await ctx.session.get(RatingDimension, dim_id)
    if not d:
        raise not_found("Rating dimension")
    if body.label and body.label != d.label:
        await record(ctx, "Setting", f"Renamed the rating “{d.label}” to “{body.label}”.")
        d.label = body.label
    if body.sort_order is not None:
        d.sort_order = body.sort_order
    return d
