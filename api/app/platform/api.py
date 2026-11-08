from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select

from app.audit.service import record
from app.core.config import get_settings
from app.core.context import Ctx, require, tenant_ctx, user_ctx
from app.core.db import sessionmaker, set_tenant
from app.core.errors import AppError, not_found
from app.workspace.demo import create_demo_tenant, ensure_user

from .models import AppUser, Membership, Tenant

router = APIRouter(tags=["platform"])
Role = str  # owner | admin | scheduler


class MembershipOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    tenant_name: str | None = None
    role: Role
    display_name: str
    status: str


class MeOut(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    memberships: list[MembershipOut]
    active_tenant_id: uuid.UUID | None
    role: Role | None


@router.get("/me", response_model=MeOut, operation_id="me_get")
async def me(ctx: Ctx = Depends(user_ctx)):
    rows = (await ctx.session.execute(select(Membership, Tenant.name).join(Tenant, Tenant.id == Membership.tenant_id)
                                      .where(Membership.user_id == ctx.user.id, Membership.status == "active"))).all()
    return MeOut(id=ctx.user.id, email=ctx.user.email, display_name=ctx.user.display_name,
                 memberships=[MembershipOut(id=m.id, tenant_id=m.tenant_id, tenant_name=n, role=m.role, display_name=m.display_name, status=m.status)
                              for m, n in rows],
                 active_tenant_id=ctx.tenant.id if ctx.tenant else None, role=ctx.membership.role if ctx.membership else None)


class MemberIn(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1)
    role: Role = Field(pattern="^(owner|admin|scheduler)$")


class MemberPatch(BaseModel):
    display_name: str | None = Field(None, min_length=1)
    role: Role | None = Field(None, pattern="^(owner|admin|scheduler)$")


@router.get("/members", response_model=list[MembershipOut], operation_id="members_list")
async def members(ctx: Ctx = Depends(tenant_ctx)):
    ms = (await ctx.session.execute(select(Membership).where(Membership.tenant_id == ctx.tenant_id, Membership.status == "active")
                                    .order_by(Membership.created_at))).scalars()
    return [MembershipOut(id=m.id, tenant_id=m.tenant_id, role=m.role, display_name=m.display_name, status=m.status) for m in ms]


@router.post("/members", response_model=MembershipOut, status_code=201, operation_id="members_create")
async def add_member(body: MemberIn, ctx: Ctx = Depends(require("owner"))):
    user = await ensure_user(ctx.session, body.email, body.display_name)
    exists = (await ctx.session.execute(select(Membership).where(Membership.tenant_id == ctx.tenant_id, Membership.user_id == user.id))).scalar_one_or_none()
    if exists and exists.status == "active":
        raise AppError(422, "name_taken", "That person is already a member")
    m = exists or Membership(tenant_id=ctx.tenant_id, user_id=user.id)
    m.role, m.display_name, m.status = body.role, body.display_name, "active"
    ctx.session.add(m)
    await ctx.session.flush()
    await record(ctx, "Setting", f"Added {body.display_name} as {body.role}.", entity_type="membership", entity_id=m.id)
    return MembershipOut(id=m.id, tenant_id=m.tenant_id, role=m.role, display_name=m.display_name, status=m.status)


async def _owners_left(ctx: Ctx, excluding: uuid.UUID) -> int:
    ms = (await ctx.session.execute(select(Membership).where(Membership.tenant_id == ctx.tenant_id, Membership.role == "owner",
                                                             Membership.status == "active", Membership.id != excluding))).scalars().all()
    return len(ms)


@router.patch("/members/{member_id}", response_model=MembershipOut, operation_id="members_update")
async def update_member(member_id: uuid.UUID, body: MemberPatch, ctx: Ctx = Depends(require("owner"))):
    m = await ctx.session.get(Membership, member_id)
    if not m or m.tenant_id != ctx.tenant_id or m.status != "active":
        raise not_found("Member")
    if body.role and body.role != "owner" and m.role == "owner" and not await _owners_left(ctx, m.id):
        raise AppError(422, "last_owner", "A workspace needs at least one owner")
    if body.role:
        m.role = body.role
    if body.display_name:
        m.display_name = body.display_name
    await record(ctx, "Setting", f"Updated member {m.display_name}: role {m.role}.", entity_type="membership", entity_id=m.id)
    return MembershipOut(id=m.id, tenant_id=m.tenant_id, role=m.role, display_name=m.display_name, status=m.status)


@router.delete("/members/{member_id}", status_code=204, operation_id="members_delete")
async def remove_member(member_id: uuid.UUID, ctx: Ctx = Depends(require("owner"))):
    m = await ctx.session.get(Membership, member_id)
    if not m or m.tenant_id != ctx.tenant_id or m.status != "active":
        raise not_found("Member")
    if m.role == "owner" and not await _owners_left(ctx, m.id):
        raise AppError(422, "last_owner", "A workspace needs at least one owner")
    m.status = "removed"
    await record(ctx, "Setting", f"Removed member {m.display_name}.", entity_type="membership", entity_id=m.id)


class DemoIn(BaseModel):
    name: str = "PPP (demo)"
    display_name: str = "Ido D."


@router.post("/dev/demo-tenant", response_model=MembershipOut, status_code=201, operation_id="dev_create_demo_tenant", tags=["dev"])
async def demo_tenant(body: DemoIn, x_dev_user: str = Header(...)):
    """Dev only: create the signed-in user (if needed) and a demo tenant seeded with the prototype's sample data."""
    if get_settings().env not in ("dev", "test"):
        raise not_found()
    async with sessionmaker()() as s:
        async with s.begin():
            await set_tenant(s, None)
            user = await ensure_user(s, x_dev_user, body.display_name)
            t = await create_demo_tenant(s, user, body.name)
            m = (await s.execute(select(Membership).where(Membership.tenant_id == t.id, Membership.user_id == user.id))).scalar_one()
            return MembershipOut(id=m.id, tenant_id=t.id, tenant_name=t.name, role=m.role, display_name=m.display_name, status=m.status)
