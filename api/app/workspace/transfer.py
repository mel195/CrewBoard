"""Whole-workspace export and import as one JSON file (WS-05).

Export writes every workspace table (settings, crews, clients, jobs, the calendar, decisions, messages, Riley, the
audit log) with ids as they are. Import gives every row a new id, so a file can be loaded into any workspace
without clashing, and points the references at the new ids, including ids kept inside JSON (Plan all items,
optimizer feedback, score snapshots).

Left out on purpose: members and sign-in (people belong to the target workspace), usage and feedback (as in the
prototype), uploaded estimate files and unfinished intake drafts, crew spreadsheet uploads, integration
connections (they hold secret references), Riley's learner switches (they name members) and idempotency keys.

Import only goes into an empty workspace (no crews, clients or jobs) or a demo workspace. A demo workspace is wiped
first through system.wipe_demo_tenant, the one way to clear append-only history, and only for demo tenants.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Any

from geoalchemy2 import Geography
from sqlalchemy import Date, DateTime, Numeric, Table, Time, delete, func, insert, select, text
from sqlalchemy.dialects.postgresql import UUID

from app.audit.service import record
from app.core.context import Ctx
from app.core.errors import AppError
from app.models import Base

FORMAT = 1
APP = "crewboard-api"
EXCLUDE = {"ops.estimate_document", "ops.intake_draft", "ops.crew_import", "ops.assistant_learner"}
SCHEMAS = ("config", "ops", "painting", "comms", "audit")
TENANT_FIELDS = ("name", "message_name", "time_zone", "currency", "default_language", "trades")


def _key(t: Table) -> str:
    return f"{t.schema}.{t.name}"


def export_tables() -> list[Table]:
    """Tables in insert order (parents first)."""
    return [t for t in Base.metadata.sorted_tables if t.schema in SCHEMAS and "tenant_id" in t.c and _key(t) not in EXCLUDE]


def wipe_tables() -> list[str]:
    """Everything a demo wipe clears, children first."""
    return [_key(t) for t in reversed(Base.metadata.sorted_tables) if t.schema in SCHEMAS and "tenant_id" in t.c]


def _plain(v: Any) -> Any:
    if isinstance(v, uuid.UUID):
        return str(v)
    if isinstance(v, Decimal):
        return str(v)
    if isinstance(v, (datetime, date, time)):
        return v.isoformat()
    return v


def _excluded_fk_cols(t: Table) -> set[str]:
    """Columns that point at a table left out of the file: they are written as null."""
    out = set()
    for fk in t.foreign_key_constraints:
        if _key(fk.referred_table) in EXCLUDE:
            out |= {c.name for c in fk.columns if c.name != "tenant_id"}
    return out


async def export(ctx: Ctx) -> dict:
    s = ctx.session
    tables: dict[str, list[dict]] = {}
    for t in export_tables():
        geo = [c.name for c in t.c if isinstance(c.type, Geography)]
        cols = [c for c in t.c if c.name != "tenant_id" and c.name not in geo]
        sel = [*cols, *[func.ST_AsText(t.c[g]).label(g) for g in geo]]
        nulls = _excluded_fk_cols(t)
        order = [t.c.id] if "id" in t.c else []
        rows = (await s.execute(select(*sel).order_by(*order))).mappings().all()
        tables[_key(t)] = [{k: (None if k in nulls else _plain(v)) for k, v in r.items()} for r in rows]
    tn = ctx.tenant
    out = {"app": APP, "format": FORMAT, "exported_at": datetime.now(timezone.utc).isoformat(),
           "workspace": {**{f: getattr(tn, f) for f in TENANT_FIELDS}, "calendar_anchor": _plain(tn.calendar_anchor), "is_demo": tn.is_demo},
           "tables": tables}
    await record(ctx, "Export", f"Exported the workspace ({sum(len(v) for v in tables.values())} records).")
    return out


def _remap(v: Any, ids: dict[str, str]) -> Any:
    if isinstance(v, str):
        return ids.get(v, v)
    if isinstance(v, list):
        return [_remap(x, ids) for x in v]
    if isinstance(v, dict):
        return {ids.get(k, k): _remap(x, ids) for k, x in v.items()}
    return v


def _coerce(col, v: Any) -> Any:
    if v is None:
        return None
    ty = col.type
    if isinstance(ty, UUID):
        return uuid.UUID(v)
    if isinstance(ty, Numeric):
        return Decimal(str(v))
    if isinstance(ty, DateTime):
        return datetime.fromisoformat(v)
    if isinstance(ty, Date):
        return date.fromisoformat(v)
    if isinstance(ty, Time):
        return time.fromisoformat(v)
    return v


async def _is_empty(ctx: Ctx) -> bool:
    from app.clients.models import Client
    from app.crews.models import Crew
    from app.jobs.models import Job
    for m in (Crew, Client, Job):
        if (await ctx.session.execute(select(m.id).limit(1))).first():
            return False
    return True


async def import_(ctx: Ctx, data: dict) -> dict:
    if not isinstance(data, dict) or data.get("app") != APP or not isinstance(data.get("tables"), dict):
        raise AppError(422, "not_a_backup", "That file isn't a Crew Board workspace export")
    if data.get("format") != FORMAT:
        raise AppError(422, "unsupported_format", f"This export is format {data.get('format')}; this server reads format {FORMAT}")
    s = ctx.session
    tables = export_tables()
    known = {_key(t) for t in tables}
    unknown = set(data["tables"]) - known
    if unknown:
        raise AppError(422, "not_a_backup", f"Unknown tables in the file: {', '.join(sorted(unknown))}")

    tn = ctx.tenant
    if tn.is_demo:
        await s.execute(text("select system.wipe_demo_tenant(:t)"), {"t": wipe_tables()})
    elif await _is_empty(ctx):
        # A new workspace may already hold default settings; the file replaces them. Audit history is append-only and stays.
        for t in reversed(tables):
            if _key(t) not in ("audit.audit_event", "ops.scheduling_decision"):
                await s.execute(delete(t))
    else:
        raise AppError(409, "workspace_not_empty", "Import only goes into an empty workspace or a demo workspace")

    ids: dict[str, str] = {}
    for rows in data["tables"].values():
        for r in rows:
            if isinstance(r.get("id"), str):
                ids[r["id"]] = str(uuid.uuid4())

    counts = {}
    for t in tables:
        rows = data["tables"].get(_key(t)) or []
        if not rows:
            continue
        geo = {c.name for c in t.c if isinstance(c.type, Geography)}
        batch = []
        for r in rows:
            r = _remap(r, ids)
            row = {"tenant_id": ctx.tenant_id}
            for c in t.c:
                if c.name == "tenant_id" or c.name not in r:
                    continue
                v = r[c.name]
                row[c.name] = func.ST_GeogFromText(v) if c.name in geo and v is not None else _coerce(c, v)
            batch.append(row)
        if geo:   # SQL expressions can't go through executemany; insert one by one
            for row in batch:
                await s.execute(insert(t).values(**row))
        else:
            await s.execute(insert(t), batch)
        counts[_key(t)] = len(batch)

    w = data.get("workspace") or {}
    for f in TENANT_FIELDS:
        if f in w and f != "name":
            setattr(tn, f, w[f])
    if tn.is_demo:
        tn.calendar_anchor = date.fromisoformat(w["calendar_anchor"]) if w.get("calendar_anchor") else None
    total = sum(counts.values())
    await s.flush()
    await record(ctx, "Import", f"Imported workspace data from a backup file ({total} records).", detail={"tables": counts})
    return {"records": total, "tables": counts, "replaced_demo_data": tn.is_demo}
