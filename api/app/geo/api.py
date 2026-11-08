from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from geoalchemy2.shape import to_shape
from pydantic import BaseModel
from sqlalchemy import select

from app.core.context import Ctx, tenant_ctx

from .models import Region, ServiceArea

router = APIRouter(tags=["geo"])


class RegionOut(BaseModel):
    id: uuid.UUID
    name: str


class AreaOut(BaseModel):
    id: uuid.UUID
    name: str
    region_id: uuid.UUID | None
    lat: float
    lng: float


@router.get("/regions", response_model=list[RegionOut], operation_id="regions_list")
async def regions(ctx: Ctx = Depends(tenant_ctx)):
    return [RegionOut(id=r.id, name=r.name) for r in (await ctx.session.execute(select(Region).order_by(Region.name))).scalars()]


@router.get("/service-areas", response_model=list[AreaOut], operation_id="service_areas_list")
async def areas(ctx: Ctx = Depends(tenant_ctx)):
    out = []
    for a in (await ctx.session.execute(select(ServiceArea).order_by(ServiceArea.name))).scalars():
        p = to_shape(a.location)
        out.append(AreaOut(id=a.id, name=a.name, region_id=a.region_id, lat=p.y, lng=p.x))
    return out
