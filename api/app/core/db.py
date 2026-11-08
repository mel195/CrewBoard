"""Database engine, declarative base, and tenant-scoped sessions.

Every tenant table carries tenant_id and is protected by row-level security. A request session runs in one
transaction and sets `app.tenant_id` with SET LOCAL semantics (set_config(..., true)), so a query that forgets
a tenant filter still only sees the active tenant's rows.
"""
from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import datetime

from sqlalchemy import DateTime, ForeignKeyConstraint, Integer, MetaData, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column

from .config import get_settings

NAMING = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING)


def new_id() -> uuid.UUID:
    return uuid.uuid4()


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class TenantScoped(Timestamps):
    """id + tenant_id + timestamps. Unique (tenant_id, id) lets children use composite FKs."""

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)

    @declared_attr
    def tenant_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(UUID(as_uuid=True), sa_fk("platform.tenant.id"), nullable=False, index=True)

    @declared_attr.directive
    def __table_args__(cls):
        extra = getattr(cls, "__extra_args__", ())
        schema = getattr(cls, "__schema__", "ops")
        return (UniqueConstraint("tenant_id", "id"), *extra, {"schema": schema})


class Versioned:
    """Optimistic concurrency: services compare If-Match with `version` and bump it on every update (DD-12)."""
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")


def sa_fk(target: str, **kw):
    from sqlalchemy import ForeignKey
    return ForeignKey(target, **kw)


def tfk(cols: list[str], target: str, ondelete: str | None = None) -> ForeignKeyConstraint:
    """Composite FK on (tenant_id, <col>) -> <target>(tenant_id, id): rows can't point at another tenant's rows."""
    return ForeignKeyConstraint(["tenant_id", *cols], [f"{target}.tenant_id", f"{target}.id"], ondelete=ondelete)


_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def engine() -> AsyncEngine:
    global _engine, _sessionmaker
    if _engine is None:
        _engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
        _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def sessionmaker() -> async_sessionmaker[AsyncSession]:
    engine()
    return _sessionmaker


async def reset_engine() -> None:
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None


async def set_tenant(session: AsyncSession, tenant_id: uuid.UUID | None) -> None:
    await session.execute(text("select set_config('app.tenant_id', :t, true)"), {"t": str(tenant_id) if tenant_id else ""})


async def plain_session() -> AsyncIterator[AsyncSession]:
    """A session with no tenant set (only platform lookups by user are visible)."""
    async with sessionmaker()() as s:
        async with s.begin():
            await set_tenant(s, None)
            yield s
