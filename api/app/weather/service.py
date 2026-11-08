"""Which forecast cell a workspace reads (BL-05, CAL-04).

The engine works with one rain forecast per workspace, as the prototype does. That forecast is the cached one for
the geohash cell (precision 4, about 40 km) around the middle of the workspace's service areas. Until a weather
provider fills the cache there is no forecast and nothing is held for rain.
"""
from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.geo.models import ServiceArea

PRECISION = 4


def geohash(lat: float, lon: float, precision: int = PRECISION) -> str:
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


def _geom():
    return func.ST_GeomFromWKB(func.ST_AsBinary(ServiceArea.location))


async def workspace_cell(s: AsyncSession) -> str | None:
    lat, lon = (await s.execute(select(func.avg(func.ST_Y(_geom())), func.avg(func.ST_X(_geom()))))).one()
    return geohash(float(lat), float(lon)) if lat is not None else None


async def area_cell(s: AsyncSession, area_id: uuid.UUID) -> str | None:
    r = (await s.execute(select(func.ST_Y(_geom()), func.ST_X(_geom())).where(ServiceArea.id == area_id))).first()
    return geohash(r[0], r[1]) if r else None
