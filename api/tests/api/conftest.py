"""API tests run against a real PostgreSQL + PostGIS database.

Set CREWBOARD_DATABASE_URL (app role) and CREWBOARD_MIGRATION_DATABASE_URL (owner role). The schema is rebuilt
from the Alembic migration at the start of the run. Docker Compose provides both (see README).
"""
from __future__ import annotations

import os

import httpx
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

from app.core.config import get_settings
from app.core.db import reset_engine

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


def _rebuild_schema():
    s = get_settings()
    eng = create_engine(s.migration_database_url)
    with eng.begin() as c:
        c.execute(text("DROP SCHEMA IF EXISTS platform, config, ops, painting, audit, shared CASCADE"))
        c.execute(text("DROP TABLE IF EXISTS public.alembic_version"))
    eng.dispose()
    cfg = Config(os.path.join(ROOT, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(ROOT, "migrations"))
    command.upgrade(cfg, "head")


@pytest.fixture(scope="session")
async def client():
    os.environ.setdefault("CREWBOARD_ENV", "test")
    get_settings.cache_clear()
    _rebuild_schema()
    await reset_engine()
    from app.main import app
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as c:
        yield c
    await reset_engine()


class As:
    """Call the API as a user in a tenant."""

    def __init__(self, client: httpx.AsyncClient, email: str, tenant_id: str | None = None):
        self.c, self.email, self.tenant_id = client, email, tenant_id

    def h(self, extra=None):
        h = {"X-Dev-User": self.email}
        if self.tenant_id:
            h["X-Tenant-Id"] = self.tenant_id
        return {**h, **(extra or {})}

    async def get(self, url, **kw):
        return await self.c.get("/api/v1" + url, headers=self.h(kw.pop("headers", None)), **kw)

    async def post(self, url, json=None, **kw):
        return await self.c.post("/api/v1" + url, json=json, headers=self.h(kw.pop("headers", None)), **kw)

    async def put(self, url, json=None, **kw):
        return await self.c.put("/api/v1" + url, json=json, headers=self.h(kw.pop("headers", None)), **kw)

    async def patch(self, url, json=None, **kw):
        return await self.c.patch("/api/v1" + url, json=json, headers=self.h(kw.pop("headers", None)), **kw)

    async def delete(self, url, **kw):
        return await self.c.delete("/api/v1" + url, headers=self.h(kw.pop("headers", None)), **kw)


async def make_demo(client, email, name) -> As:
    r = await client.post("/api/v1/dev/demo-tenant", json={"name": name, "display_name": email.split("@")[0]}, headers={"X-Dev-User": email})
    assert r.status_code == 201, r.text
    return As(client, email, r.json()["tenant_id"])


@pytest.fixture(scope="session")
async def ido(client) -> As:
    return await make_demo(client, "ido@ppp.example", "PPP (demo)")


@pytest.fixture(scope="session")
async def other(client) -> As:
    return await make_demo(client, "someone@other.example", "Other Co (demo)")
