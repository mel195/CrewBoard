"""Request context: who is calling, in which tenant, inside one transaction with RLS set.

Auth modes (Phase 2, tab 1 Security):
- dev: `X-Dev-User: <email>` identifies the user. Local development and tests only; refused in staging/prod.
- oidc: bearer token validation. Not built yet; waits on the identity provider choice (TQ-01).
"""
from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass

from fastapi import Depends, Header
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.platform.models import AppUser, Membership, Tenant

from .config import get_settings
from .db import sessionmaker, set_tenant
from .errors import AppError

ROLE_RANK = {"scheduler": 1, "admin": 2, "owner": 3}


@dataclass
class Ctx:
    session: AsyncSession
    user: AppUser
    membership: Membership | None
    tenant: Tenant | None

    @property
    def tenant_id(self) -> uuid.UUID:
        return self.tenant.id

    @property
    def actor_label(self) -> str:
        if self.membership:
            return f"{self.membership.display_name} ({self.membership.role.capitalize()})"
        return self.user.display_name


async def _resolve_user(session: AsyncSession, x_dev_user: str | None, authorization: str | None) -> AppUser:
    s = get_settings()
    if s.auth_mode == "dev":
        if s.env in ("staging", "prod"):
            raise AppError(500, "misconfigured", "Dev auth is not allowed in this environment")
        if not x_dev_user:
            raise AppError(401, "unauthenticated", "Sign in first (X-Dev-User header in dev)")
        user = (await session.execute(select(AppUser).where(AppUser.email == x_dev_user.strip().lower()))).scalar_one_or_none()
        if not user:
            raise AppError(401, "unauthenticated", "Unknown user")
        return user
    raise AppError(501, "auth_not_configured", "OIDC sign-in isn't set up yet (TQ-01)")


async def _base(x_dev_user: str | None, authorization: str | None, x_tenant_id: str | None, need_tenant: bool) -> AsyncIterator[Ctx]:
    async with sessionmaker()() as session:
        async with session.begin():
            await set_tenant(session, None)
            user = await _resolve_user(session, x_dev_user, authorization)
            await session.execute(text("select set_config('app.user_id', :u, true)"), {"u": str(user.id)})
            membership = tenant = None
            if x_tenant_id:
                try:
                    tid = uuid.UUID(x_tenant_id)
                except ValueError:
                    raise AppError(400, "invalid_request", "X-Tenant-Id must be a UUID")
                membership = (await session.execute(select(Membership).where(
                    Membership.tenant_id == tid, Membership.user_id == user.id, Membership.status == "active"))).scalar_one_or_none()
                if not membership:
                    raise AppError(404, "not_found", "Workspace not found")
                await set_tenant(session, tid)
                tenant = await session.get(Tenant, tid)
            elif need_tenant:
                raise AppError(400, "invalid_request", "X-Tenant-Id header is required")
            yield Ctx(session, user, membership, tenant)


async def user_ctx(x_dev_user: str | None = Header(None), authorization: str | None = Header(None),
                   x_tenant_id: str | None = Header(None)) -> AsyncIterator[Ctx]:
    async for c in _base(x_dev_user, authorization, x_tenant_id, need_tenant=False):
        yield c


async def tenant_ctx(x_dev_user: str | None = Header(None), authorization: str | None = Header(None),
                     x_tenant_id: str | None = Header(None)) -> AsyncIterator[Ctx]:
    async for c in _base(x_dev_user, authorization, x_tenant_id, need_tenant=True):
        yield c


def require(role: str):
    """Dependency: active tenant + at least this role (scheduler < admin < owner)."""
    async def dep(ctx: Ctx = Depends(tenant_ctx)) -> Ctx:
        if ROLE_RANK[ctx.membership.role] < ROLE_RANK[role]:
            raise AppError(403, "forbidden", f"Needs the {role} role")
        return ctx
    return dep


def check_version(current: int, if_match: str | None) -> None:
    """Optimistic concurrency (DD-12). If-Match is required on updates of versioned resources."""
    if if_match is None:
        raise AppError(428, "precondition_required", "Send If-Match with the version you edited")
    if if_match.strip('W/"') != str(current):
        raise AppError(409, "version_conflict", "Someone else changed this. Reload and try again.", current_version=current)
