"""PaintScout as an estimate source (ADD-04). Not connected until the connector is built: no sold estimates are listed.

The source is a FastAPI dependency so the real connector can drop in here, and tests can supply their own.
An item is {id, file, text, ps: {client, area, value, sold, ...}, human: {...typed fields} | None}.
"""
from __future__ import annotations

from typing import Protocol

from app.core.context import Ctx
from app.core.errors import AppError


class EstimateSource(Protocol):
    async def sold_estimates(self, ctx: Ctx) -> list[dict]: ...
    async def estimate(self, ctx: Ctx, estimate_id: str) -> dict | None: ...


class NotConnected:
    async def sold_estimates(self, ctx: Ctx) -> list[dict]:
        return []

    async def estimate(self, ctx: Ctx, estimate_id: str) -> dict | None:
        raise AppError(503, "connector_not_connected", "PaintScout isn't connected yet")


def get_estimate_source() -> EstimateSource:
    return NotConnected()
