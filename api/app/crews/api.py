"""Crews: roster, profile, ratings, members (CRW-01 to CRW-08)."""
from __future__ import annotations

import uuid
from collections import defaultdict

from fastapi import APIRouter, Depends, Header, Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.audit.service import record
from app.core.context import Ctx, check_version, require, tenant_ctx
from app.core.errors import AppError, not_found
from app.geo.models import Region, ServiceArea
from app.settings.models import RatingDimension

from .models import Crew, CrewHours, CrewMember, CrewRating

router = APIRouter(tags=["crews"])


class RatingOut(BaseModel):
    dimension: str
    value: float | None
    source: str
    review_count: int


class MemberOut(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    is_lead: bool
    languages: str
    note: str


class HoursOut(BaseModel):
    weekday: list[str] | None = None
    saturday: list[str] | None = None
    sunday: list[str] | None = None


class CrewOut(BaseModel):
    id: uuid.UUID
    name: str
    color: str
    status: str
    size_min: int | None
    size_max: int | None
    base_area_id: uuid.UUID | None
    base_area: str | None
    region_id: uuid.UUID | None
    region: str | None
    languages: str
    lead_language: str | None
    channel: str | None
    lead_safe_certified: bool | None
    phone: str | None
    email: str | None
    notes: str
    hours: HoursOut | None
    ratings: list[RatingOut]
    members: list[MemberOut]
    ready: bool
    missing: list[str]
    version: int


class CrewIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    size_min: int | None = Field(None, gt=0)
    size_max: int | None = Field(None, gt=0)
    base_area_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None


class CrewPatch(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    status: str | None = Field(None, pattern="^(active|inactive)$")
    size_min: int | None = Field(None, gt=0)
    size_max: int | None = Field(None, gt=0)
    base_area_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    languages: str | None = None
    lead_language: str | None = None
    channel: str | None = Field(None, pattern="^(text|email|whatsapp)$")
    lead_safe_certified: bool | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class RatingIn(BaseModel):
    value: float | None = Field(None, ge=1, le=5, multiple_of=0.5)


def missing_fields(c: Crew, has_job_rating: bool) -> list[str]:
    """Readiness (BL-11, v5): status, size, base, region, at least one job-type rating."""
    m = []
    if not c.size_min:
        m.append("size")
    if not c.base_area_id:
        m.append("base")
    if not c.region_id:
        m.append("region")
    if not has_job_rating:
        m.append("jobRating")
    return m


async def _load(ctx: Ctx, crews: list[Crew]) -> list[CrewOut]:
    s = ctx.session
    ids = [c.id for c in crews]
    dims = {d.id: d for d in (await s.execute(select(RatingDimension))).scalars()}
    areas = {a.id: a.name for a in (await s.execute(select(ServiceArea))).scalars()}
    regions = {r.id: r.name for r in (await s.execute(select(Region))).scalars()}
    ratings, members, hours = defaultdict(list), defaultdict(list), defaultdict(list)
    for r in (await s.execute(select(CrewRating).where(CrewRating.crew_id.in_(ids)))).scalars():
        ratings[r.crew_id].append(r)
    for m in (await s.execute(select(CrewMember).where(CrewMember.crew_id.in_(ids)).order_by(CrewMember.sort_order))).scalars():
        members[m.crew_id].append(m)
    for h in (await s.execute(select(CrewHours).where(CrewHours.crew_id.in_(ids)))).scalars():
        hours[h.crew_id].append(h)
    out = []
    for c in crews:
        rs = ratings[c.id]
        has_job = any(r.value is not None and dims[r.dimension_id].kind == "job_type" for r in rs)
        miss = missing_fields(c, has_job)
        hb = {h.day_kind: [h.start_time.strftime("%H:%M"), h.end_time.strftime("%H:%M")] if h.start_time else None for h in hours[c.id]}
        out.append(CrewOut(
            id=c.id, name=c.name, color=c.color, status=c.status, size_min=c.size_min, size_max=c.size_max, base_area_id=c.base_area_id,
            base_area=areas.get(c.base_area_id), region_id=c.region_id, region=regions.get(c.region_id), languages=c.languages,
            lead_language=c.lead_language, channel=c.channel, lead_safe_certified=c.lead_safe_certified, phone=c.phone, email=c.email,
            notes=c.notes, hours=HoursOut(**hb) if hb else None,
            ratings=[RatingOut(dimension=dims[r.dimension_id].key, value=float(r.value) if r.value is not None else None, source=r.source, review_count=r.review_count) for r in rs],
            members=[MemberOut(id=m.id, name=m.name, role=m.role, is_lead=m.is_lead, languages=m.languages, note=m.note) for m in members[c.id]],
            ready=c.status == "active" and not miss, missing=miss, version=c.version))
    return out


@router.get("/crews", response_model=list[CrewOut], operation_id="crews_list")
async def list_crews(status: str | None = None, region_id: uuid.UUID | None = None, needs_info: bool = False, ctx: Ctx = Depends(tenant_ctx)):
    q = select(Crew).where(Crew.archived_at.is_(None)).order_by(Crew.sort_order, Crew.name)
    if status:
        q = q.where(Crew.status == status)
    if region_id:
        q = q.where(Crew.region_id == region_id)
    out = await _load(ctx, (await ctx.session.execute(q)).scalars().all())
    return [c for c in out if c.missing] if needs_info else out


async def _get(ctx: Ctx, crew_id: uuid.UUID) -> Crew:
    c = await ctx.session.get(Crew, crew_id)
    if not c or c.archived_at:
        raise not_found("Crew")
    return c


@router.get("/crews/{crew_id}", response_model=CrewOut, operation_id="crews_get")
async def get_crew(crew_id: uuid.UUID, response: Response, ctx: Ctx = Depends(tenant_ctx)):
    c = await _get(ctx, crew_id)
    response.headers["ETag"] = f'"{c.version}"'
    return (await _load(ctx, [c]))[0]


@router.post("/crews", response_model=CrewOut, status_code=201, operation_id="crews_create")
async def create_crew(body: CrewIn, ctx: Ctx = Depends(require("admin"))):
    dup = (await ctx.session.execute(select(Crew).where(Crew.name.ilike(body.name), Crew.archived_at.is_(None)))).scalar_one_or_none()
    if dup:
        raise AppError(422, "name_taken", "A crew with that name exists")
    n = len((await ctx.session.execute(select(Crew.id))).all())
    c = Crew(tenant_id=ctx.tenant_id, name=body.name, size_min=body.size_min, size_max=body.size_max or body.size_min,
             base_area_id=body.base_area_id, region_id=body.region_id, sort_order=n)
    ctx.session.add(c)
    await ctx.session.flush()
    await record(ctx, "Crew data", f"Added crew {c.name} by hand.", entity_type="crew", entity_id=c.id)
    return (await _load(ctx, [c]))[0]


@router.patch("/crews/{crew_id}", response_model=CrewOut, operation_id="crews_update")
async def update_crew(crew_id: uuid.UUID, body: CrewPatch, response: Response, if_match: str | None = Header(None),
                      ctx: Ctx = Depends(require("admin"))):
    c = await _get(ctx, crew_id)
    check_version(c.version, if_match)
    changes = {}
    for k, v in body.model_dump(exclude_unset=True).items():
        if getattr(c, k) != v:
            changes[k] = [str(getattr(c, k)), str(v)]
            setattr(c, k, v)
    if c.size_min and (not c.size_max or c.size_max < c.size_min):
        c.size_max = c.size_min
    if changes:
        c.version += 1
        await record(ctx, "Crew data", f"{c.name}: " + ", ".join(f"{k} → {b}" for k, (a, b) in changes.items()) + ".",
                     entity_type="crew", entity_id=c.id, detail=changes)
    response.headers["ETag"] = f'"{c.version}"'
    return (await _load(ctx, [c]))[0]


@router.put("/crews/{crew_id}/ratings/{dimension_key}", response_model=RatingOut, operation_id="crews_rating_put")
async def put_rating(crew_id: uuid.UUID, dimension_key: str, body: RatingIn, ctx: Ctx = Depends(require("admin"))):
    """Admin-entered ratings count right away regardless of review count (BL-17)."""
    c = await _get(ctx, crew_id)
    d = (await ctx.session.execute(select(RatingDimension).where(RatingDimension.key == dimension_key))).scalar_one_or_none()
    if not d:
        raise not_found("Rating dimension")
    r = (await ctx.session.execute(select(CrewRating).where(CrewRating.crew_id == c.id, CrewRating.dimension_id == d.id))).scalar_one_or_none()
    old = r.value if r else None
    if not r:
        r = CrewRating(tenant_id=ctx.tenant_id, crew_id=c.id, dimension_id=d.id, review_count=0)
        ctx.session.add(r)
    r.value, r.source = body.value, "admin"
    c.version += 1
    await record(ctx, "Crew data", f"{c.name}: {d.label} rating {old if old is not None else '–'} → {body.value if body.value is not None else '–'}.",
                 entity_type="crew", entity_id=c.id, detail={"dimension": d.key, "old": old, "new": body.value})
    return RatingOut(dimension=d.key, value=float(r.value) if r.value is not None else None, source=r.source, review_count=r.review_count or 0)


class MemberIn(BaseModel):
    name: str = Field(min_length=1)
    role: str = "Painter"
    is_lead: bool = False
    languages: str = ""
    note: str = ""


@router.post("/crews/{crew_id}/members", response_model=MemberOut, status_code=201, operation_id="crews_members_create")
async def add_member(crew_id: uuid.UUID, body: MemberIn, ctx: Ctx = Depends(require("admin"))):
    c = await _get(ctx, crew_id)
    if body.is_lead:
        for m in (await ctx.session.execute(select(CrewMember).where(CrewMember.crew_id == c.id, CrewMember.is_lead))).scalars():
            m.is_lead = False
        await ctx.session.flush()
    n = len((await ctx.session.execute(select(CrewMember.id).where(CrewMember.crew_id == c.id))).all())
    m = CrewMember(tenant_id=ctx.tenant_id, crew_id=c.id, sort_order=n, **body.model_dump())
    ctx.session.add(m)
    await ctx.session.flush()
    await record(ctx, "Crew data", f"Added {m.name} to {c.name}.", entity_type="crew", entity_id=c.id)
    return MemberOut(id=m.id, name=m.name, role=m.role, is_lead=m.is_lead, languages=m.languages, note=m.note)


@router.delete("/crews/{crew_id}/members/{member_id}", status_code=204, operation_id="crews_members_delete")
async def remove_member(crew_id: uuid.UUID, member_id: uuid.UUID, ctx: Ctx = Depends(require("admin"))):
    c = await _get(ctx, crew_id)
    m = await ctx.session.get(CrewMember, member_id)
    if not m or m.crew_id != c.id:
        raise not_found("Member")
    await ctx.session.delete(m)
    await record(ctx, "Crew data", f"Removed {m.name} from {c.name}.", entity_type="crew", entity_id=c.id)
