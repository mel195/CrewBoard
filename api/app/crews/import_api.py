"""Crew export, spreadsheet import, and who works well together (CRW-09 to CRW-11, CRW-13).

The import follows the prototype's readSheet/applyImport: every sheet whose header row (in the first 8 rows) has a
"Crew" or "Name" column is read, a group row above the header ("JOB TYPES", "SKILLS", "ATTRIBUTES") tells rating
columns apart, sheets are merged on the crew name, and Excel's habit of turning "2-3" crew sizes into dates is
undone. Two changes from the prototype (listed in the README): crews missing from the sheet are kept rather than dropped, and
existing rating dimensions are kept with new ones added, since the database is shared by every screen.
"""
from __future__ import annotations

import csv
import io
import re
import uuid
from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, File, Header, Request, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app.audit.service import record
from app.core import idempotency
from app.core.context import Ctx, require, tenant_ctx
from app.core.errors import AppError, not_found
from app.geo.models import Region, ServiceArea
from app.scheduling.models import Placement, PlacementCrew
from app.jobs.models import Job
from app.settings.models import RatingDimension

from .models import Crew, CrewImport, CrewRating

router = APIRouter(tags=["crews"])

MAP_OPTIONS = {"ignore": "Ignore", "name": "Crew name", "sfName": "Salesforce name", "email": "Email", "phone": "Phone",
               "gcal": "Calendar name", "status": "Status", "size": "Crew size", "base": "Home base", "notes": "Notes",
               "r-job": "Rating: job type", "r-skill": "Rating: skill", "r-attr": "Rating: attribute", "info": "Other info"}
ALIAS = [(r"interior", "interior"), (r"exterior", "exterior"), (r"cabinet", "cabinets"), (r"commercial|hoa", "commercial"),
         (r"wallpaper", "wallpaper"), (r"decorat", "decorative"), (r"drywall|skim", "drywall"), (r"prep", "prep"), (r"cut", "cutin"),
         (r"spray", "spray"), (r"color|detail", "color"), (r"speed", "speed"), (r"reliab", "reliability"), (r"quality", "quality"),
         (r"communic", "communication"), (r"care|jobsite", "care"), (r"independ", "independence"), (r"client", "client")]
KIND = {"job": "job_type", "skill": "skill", "attr": "attribute"}
GROUP = {"job_type": "job", "skill": "skill", "attribute": "attr"}
NAME_RE = re.compile(r"^(crew|name)$", re.I)
COLORS = ["#2F6BD8", "#D8572F", "#2FA36B", "#8A4FD8", "#D8A62F", "#2FA3D8", "#D82F7A", "#6B8A2F"]
MAX_BYTES = 10 * 1024 * 1024


def slug(s: str) -> str:
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))


def dim_key(label: str) -> str:
    return next((k for rx, k in ALIAS if re.search(rx, label, re.I)), slug(label))


def parse_size(v) -> tuple[int, int] | None:
    if v is None or v == "":
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    m = re.match(r"^(\d+)(?:\s*(?:-|to)\s*(\d+))?$", str(v).strip())
    if not m:
        return None
    a, b = int(m[1]), int(m[2] or m[1])
    return min(a, b), max(a, b)


def size_from(v) -> tuple[tuple[int, int] | None, bool]:
    """Excel turns "2-3" into Feb 3. Read the month and day back as the range (prototype sizeFrom)."""
    if isinstance(v, (datetime, date)):
        return parse_size(f"{v.month}-{v.day}"), True
    return parse_size(v), False


def _cell(v):
    if isinstance(v, float) and v.is_integer() and abs(v) > 1e6:   # phone numbers stored as numbers
        return str(int(v))
    return v


def read_rows(name: str, raw: bytes) -> list[tuple[str, list[list]]]:
    if name.lower().endswith((".xlsx", ".xlsm")):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(raw), data_only=True, read_only=True)
        except Exception:
            raise AppError(422, "unreadable_file", "That spreadsheet couldn't be opened")
        return [(ws.title, [[_cell(c) for c in r] for r in ws.iter_rows(values_only=True)]) for ws in wb.worksheets]
    if name.lower().endswith(".csv"):
        text = raw.decode("utf-8-sig", "replace")
        rows = [[(c if c != "" else None) for c in r] for r in csv.reader(io.StringIO(text))]
        def num(c):
            try:
                return float(c) if c is not None and re.fullmatch(r"-?\d+(\.\d+)?", c.strip()) else c
            except ValueError:
                return c
        return [("Sheet1", [[num(c) for c in r] for r in rows])]
    raise AppError(422, "unsupported_file", "Upload an .xlsx or .csv file")


def detect(sheets_raw, dims: dict[str, RatingDimension]) -> tuple[list[dict], list[dict], list[str]]:
    sheets = []
    for name, rows in sheets_raw:
        h, best = -1, 0
        for i in range(min(8, len(rows))):
            r = rows[i] or []
            strs = sum(1 for v in r if isinstance(v, str) and v.strip())
            if strs >= 3 and strs > best and any(isinstance(v, str) and NAME_RE.match(v.strip()) for v in r):
                h, best = i, strs
        if h < 0:
            continue
        head = rows[h]
        gr = rows[h - 1] if h > 0 else []
        g, groups = None, []
        for j in range(len(head)):
            if j < len(gr) and isinstance(gr[j], str) and gr[j].strip():
                g = gr[j].strip()
            groups.append(g)
        ni = next(j for j, v in enumerate(head) if isinstance(v, str) and NAME_RE.match(v.strip()))
        data = [r for r in rows[h + 1:] if r and ni < len(r) and r[ni] not in (None, "")]
        sheets.append({"name": name, "header_row": h, "head": head, "groups": groups, "name_col": ni, "rows": data})
    if not sheets:
        raise AppError(422, "no_header", "No sheet has a Crew or Name column in its first 8 rows")
    cols = []
    for s in sheets:
        for j, hd in enumerate(s["head"]):
            if hd is None or str(hd).strip() == "":
                continue
            head, grp = str(hd).strip(), s["groups"][j] or ""
            vals = [r[j] for r in s["rows"] if j < len(r) and r[j] not in (None, "")]
            ex = vals[0] if vals else ""
            ex = f"(date) {ex:%m-%d}" if isinstance(ex, (datetime, date)) else str(ex)[:24]
            num = bool(vals) and all(isinstance(v, (int, float)) and 0 <= v <= 5 for v in vals)
            g = "info"
            if NAME_RE.match(head): g = "name"
            elif re.search(r"salesforce", head, re.I): g = "sfName"
            elif re.search(r"e-?mail", head, re.I): g = "email"
            elif re.search(r"phone", head, re.I): g = "phone"
            elif re.search(r"calendar", head, re.I): g = "gcal"
            elif re.search(r"status", head, re.I): g = "status"
            elif re.search(r"size", head, re.I): g = "size"
            elif re.search(r"base|location|city|area", head, re.I): g = "base"
            elif re.search(r"note", head, re.I): g = "notes"
            elif re.search(r"job", grp, re.I): g = "r-job"
            elif re.search(r"skill", grp, re.I): g = "r-skill"
            elif re.search(r"attrib", grp, re.I) or num: g = "r-attr"
            if g.startswith("r-") and dim_key(head) in dims:
                g = "r-" + GROUP[dims[dim_key(head)].kind]
            cols.append({"index": len(cols), "sheet": s["name"], "col": j, "header": head, "group": grp, "sample": ex, "guess": g})
    names = list(dict.fromkeys(str(r[s["name_col"]]).strip() for s in sheets for r in s["rows"]))
    return sheets, cols, names


def _json(v):
    if isinstance(v, (datetime, date)):
        return {"date": v.isoformat()[:10]}
    if isinstance(v, Decimal):
        return float(v)
    return v


def _unjson(v):
    if isinstance(v, dict) and "date" in v:
        return date.fromisoformat(v["date"])
    return v


class ColumnOut(BaseModel):
    index: int
    sheet: str
    header: str
    group: str
    sample: str
    guess: str


class ImportOut(BaseModel):
    id: uuid.UUID
    file_name: str
    sheets: list[dict]
    columns: list[ColumnOut]
    crews: list[str]
    options: dict[str, str]
    status: str


@router.post("/crew-imports", response_model=ImportOut, status_code=201, operation_id="crew_imports_create")
async def upload(file: UploadFile = File(...), ctx: Ctx = Depends(require("admin"))):
    """Upload a crew sheet (.xlsx or .csv). Returns the columns found and a guess for each; nothing changes until commit."""
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise AppError(413, "file_too_large", "Crew sheets can be up to 10 MB")
    dims = {d.key: d for d in (await ctx.session.execute(select(RatingDimension))).scalars()}
    sheets, cols, names = detect(read_rows(file.filename or "upload", raw), dims)
    imp = CrewImport(tenant_id=ctx.tenant_id, file_name=file.filename or "upload", columns=cols, created_by=ctx.membership.id,
                     sheets=[{"name": s["name"], "header_row": s["header_row"] + 1, "rows": len(s["rows"])} for s in sheets],
                     data=[{"name": s["name"], "name_col": s["name_col"], "rows": [[_json(v) for v in r] for r in s["rows"]]} for s in sheets])
    ctx.session.add(imp)
    await ctx.session.flush()
    return ImportOut(id=imp.id, file_name=imp.file_name, sheets=imp.sheets, columns=[ColumnOut(**{k: c[k] for k in ColumnOut.model_fields}) for c in cols],
                     crews=names, options=MAP_OPTIONS, status=imp.status)


class MapItem(BaseModel):
    column: int | None = None     # index from the upload response
    header: str | None = None     # or the header text (first match)
    use_as: str = Field(alias="as")


class CommitIn(BaseModel):
    mapping: list[MapItem] = []   # only the columns to change; the rest keep their guess


def plural(n: int, w: str) -> str:
    return f"{n} {w}{'' if n == 1 else 's'}"


@router.post("/crew-imports/{import_id}/commit", operation_id="crew_imports_commit")
async def commit(import_id: uuid.UUID, body: CommitIn, request: Request, idempotency_key: str | None = Header(None),
                 ctx: Ctx = Depends(require("admin"))):
    """Apply the sheet: add or update crews by name, set ratings (source "import"), add new rating columns as dimensions."""
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, body.model_dump(mode="json", by_alias=True))
    if prev is not None:
        return prev
    s = ctx.session
    imp = await s.get(CrewImport, import_id)
    if not imp:
        raise not_found("Import")
    if imp.status != "previewed":
        raise AppError(409, "import_closed", "This import was already applied")
    cols = [dict(c, use=c["guess"]) for c in imp.columns]
    for m in body.mapping:
        if m.use_as not in MAP_OPTIONS:
            raise AppError(422, "validation_failed", f"Unknown column use {m.use_as}")
        c = cols[m.column] if m.column is not None and 0 <= m.column < len(cols) else next((c for c in cols if c["header"] == m.header), None)
        if c is None:
            raise AppError(422, "validation_failed", f"No column {m.column if m.column is not None else m.header}")
        c["use"] = m.use_as

    dims = {d.key: d for d in (await s.execute(select(RatingDimension))).scalars()}
    new_dims = []
    for c in cols:
        if c["use"].startswith("r-"):
            k = dim_key(c["header"])
            if k not in dims:
                d = RatingDimension(tenant_id=ctx.tenant_id, key=k, label=c["header"], kind=KIND[c["use"][2:]], trade="painting",
                                    sort_order=len(dims) + len(new_dims))
                s.add(d)
                new_dims.append(d)
                dims[k] = d
    await s.flush()

    areas = {a.name.lower(): a for a in (await s.execute(select(ServiceArea))).scalars()}
    by_name: dict[str, dict] = {}
    fixed, unknown_base, bad_ratings = [], set(), 0
    for sh in imp.data:
        for r in sh["rows"]:
            r = [_unjson(v) for v in r]
            nm = str(r[sh["name_col"]]).strip()
            cr = by_name.setdefault(nm, {"f": {}, "r": {}, "info": []})
            for c in cols:
                if c["sheet"] != sh["name"] or c["use"] in ("ignore", "name") or c["col"] >= len(r):
                    continue
                v = r[c["col"]]
                if v is None or v == "":
                    continue
                u = c["use"]
                if u == "size":
                    z, was_date = size_from(v)
                    if z:
                        cr["f"]["size"] = z
                        if was_date:
                            fixed.append(nm)
                elif u.startswith("r-"):
                    try:
                        n = float(v)
                    except (TypeError, ValueError):
                        continue
                    if 1 <= n <= 5:
                        cr["r"][dim_key(c["header"])] = round(n * 2) / 2
                    else:
                        bad_ratings += 1
                elif u == "status":
                    cr["f"]["status"] = "inactive" if re.search(r"inact|no|off", str(v), re.I) else "active"
                elif u == "base":
                    a = areas.get(str(v).strip().lower())
                    if a:
                        cr["f"]["base"] = a
                    else:
                        unknown_base.add(str(v).strip())
                elif u == "info":
                    cr["info"].append(f"{c['header']}: {v}")
                else:
                    cr["f"][u] = str(v).strip()

    existing = {c.name.lower(): c for c in (await s.execute(select(Crew).where(Crew.archived_at.is_(None)))).scalars()}
    created, updated, blank_status = 0, 0, 0
    for i, (nm, cr) in enumerate(by_name.items()):
        c = existing.get(nm.lower())
        if c is None:
            c = Crew(tenant_id=ctx.tenant_id, name=nm, color=COLORS[(len(existing) + created) % len(COLORS)], sort_order=len(existing) + created)
            s.add(c)
            created += 1
        else:
            updated += 1
        f = cr["f"]
        if "status" in f:
            c.status = f["status"]
        elif nm.lower() not in existing:
            blank_status += 1
            c.status = "inactive" if re.search(r"test", nm, re.I) else "active"
        if "size" in f:
            c.size_min, c.size_max = f["size"]
        if "base" in f:
            c.base_area_id = f["base"].id
            if not c.region_id and f["base"].region_id:
                c.region_id = f["base"].region_id
        for k, attr in (("sfName", "salesforce_name"), ("gcal", "calendar_id"), ("email", "email"), ("phone", "phone")):
            if k in f:
                setattr(c, attr, f[k])
        notes = [x for x in [f.get("notes"), *cr["info"]] if x]
        if notes:
            c.notes = "\n".join(notes)
        if nm.lower() in existing:
            c.version += 1
        await s.flush()
        cur = {r.dimension_id: r for r in (await s.execute(select(CrewRating).where(CrewRating.crew_id == c.id))).scalars()}
        for k, v in cr["r"].items():
            d = dims[k]
            row = cur.get(d.id) or CrewRating(tenant_id=ctx.tenant_id, crew_id=c.id, dimension_id=d.id, review_count=0)
            row.value, row.source = v, "import"
            s.add(row)
    await s.flush()

    job_dims = {d.id for d in dims.values() if d.kind == "job_type"}
    rated = (await s.execute(select(func.count(func.distinct(CrewRating.crew_id))).where(CrewRating.dimension_id.in_(job_dims),
                                                                                         CrewRating.value.is_not(None)))).scalar()
    total = (await s.execute(select(func.count()).select_from(Crew).where(Crew.archived_at.is_(None)))).scalar()
    kinds = defaultdict(int)
    for d in dims.values():
        kinds[d.kind] += 1
    findings = [("ok", f"Merged {plural(len(imp.data), 'sheet')} on crew name: {plural(len(by_name), 'crew')} ({created} new, {updated} updated).")]
    if new_dims:
        findings.append(("ok", f"Added {plural(len(new_dims), 'rating column')}: {', '.join(d.label for d in new_dims)}."))
    findings.append(("ok", f"Crew Board ranks on {kinds['job_type']} job types, {kinds['skill']} skills, {kinds['attribute']} attributes."))
    if fixed:
        findings.append(("warn", f"{plural(len(fixed), 'crew size')} had been turned into dates by Excel. Fixed and shown as ranges. Please confirm."))
    if blank_status:
        findings.append(("warn", f"Status was blank for {plural(blank_status, 'new crew')}. Set to active (test rows inactive)."))
    if unknown_base:
        findings.append(("warn", f"Home base not found in your service areas: {', '.join(sorted(unknown_base))}."))
    if bad_ratings:
        findings.append(("warn", f"{plural(bad_ratings, 'rating')} outside 1 to 5 were skipped."))
    findings.append(("warn", f"{rated} of {total} crews have job-type ratings. The rest can’t be matched until rated."))
    result = {"created": created, "updated": updated, "new_dimensions": [d.key for d in new_dims], "findings": [{"level": a, "text": b} for a, b in findings]}
    imp.mapping = [{"index": c["index"], "as": c["use"]} for c in cols]
    imp.status, imp.result, imp.data = "committed", result, []    # the parsed rows (phones, emails) aren't kept after commit
    await record(ctx, "Crew data", f"Imported {imp.file_name}: {plural(len(by_name), 'crew')}, {plural(len([c for c in cols if c['use'].startswith('r-')]), 'rating column')}."
                 + (f" Fixed {len(fixed)} crew sizes Excel had turned into dates." if fixed else ""), entity_type="crew_import", entity_id=imp.id)
    await idempotency.store(ctx, idempotency_key, request.url.path, body.model_dump(mode="json", by_alias=True), result)
    return result


@router.get("/crews/export.csv", response_class=PlainTextResponse, operation_id="crews_export_csv")
async def export_csv(ctx: Ctx = Depends(require("admin"))):
    """Every crew with its fields and ratings, in a sheet that imports back as is."""
    s = ctx.session
    dims = (await s.execute(select(RatingDimension).order_by(RatingDimension.sort_order))).scalars().all()
    areas = {a.id: a.name for a in (await s.execute(select(ServiceArea))).scalars()}
    regions = {r.id: r.name for r in (await s.execute(select(Region))).scalars()}
    ratings = defaultdict(dict)
    for r in (await s.execute(select(CrewRating))).scalars():
        ratings[r.crew_id][r.dimension_id] = r.value
    grp = {"job_type": "JOB TYPES", "skill": "SKILLS", "attribute": "ATTRIBUTES"}
    buf = io.StringIO()
    w = csv.writer(buf)
    base = ["Crew", "Status", "Crew size", "Home base", "Region", "Languages", "Lead language", "Channel", "Lead-safe", "Phone", "Email",
            "Salesforce name", "Calendar name", "Notes"]
    groups, last = [], None
    for d in dims:
        g = grp[d.kind]
        groups.append(g if g != last else "")
        last = g
    w.writerow(["CREW"] + [""] * (len(base) - 1) + groups)
    w.writerow(base + [d.label for d in dims])
    for c in (await s.execute(select(Crew).where(Crew.archived_at.is_(None)).order_by(Crew.sort_order, Crew.name))).scalars():
        size = "" if not c.size_min else str(c.size_min) if c.size_min == c.size_max else f"{c.size_min}-{c.size_max}"
        def num(v):
            return "" if v is None else (str(int(v)) if float(v).is_integer() else str(float(v)))
        w.writerow([c.name, c.status, size, areas.get(c.base_area_id, ""), regions.get(c.region_id, ""), c.languages, c.lead_language or "",
                    c.channel or "", "" if c.lead_safe_certified is None else ("Yes" if c.lead_safe_certified else "No"), c.phone or "", c.email or "",
                    c.salesforce_name or "", c.calendar_id or "", c.notes] + [num(ratings[c.id].get(d.id)) for d in dims])
    await record(ctx, "Export", "Exported crews as CSV.")
    return PlainTextResponse(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="crewboard-crews.csv"'})


# ---------- who works well together (CRW-13) ----------

@router.get("/crews/{crew_id}/pairings", operation_id="crews_pairings")
async def pairings(crew_id: uuid.UUID, job_type: str = "all", ctx: Ctx = Depends(tenant_ctx)):
    """Crews this crew shared jobs with, by type of work: jobs where both were on the same placement (a second crew).
    Empty until crews have worked together in Crew Board."""
    s = ctx.session
    me = await s.get(Crew, crew_id)
    if not me or me.archived_at:
        raise not_found("Crew")
    crews = {c.id: c for c in (await s.execute(select(Crew).where(Crew.archived_at.is_(None)))).scalars()}
    dims = {d.id: d.key for d in (await s.execute(select(RatingDimension).where(RatingDimension.kind == "job_type"))).scalars()}
    by: dict[uuid.UUID, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    pcs = defaultdict(set)
    for pc in (await s.execute(select(PlacementCrew))).scalars():
        pcs[pc.placement_id].add(pc.crew_id)
    jobs = {p.id: p.job_id for p in (await s.execute(select(Placement))).scalars()}
    jt = {j.id: dims.get(j.job_type_id) for j in (await s.execute(select(Job))).scalars()}
    for pid, members in pcs.items():
        if crew_id in members:
            for o in members - {crew_id}:
                by[o][jt.get(jobs.get(pid)) or "other"] += 1
    out = []
    for o, counts in by.items():
        n = sum(counts.values()) if job_type == "all" else counts.get(job_type, 0)
        if n > 0 and o in crews:
            out.append({"crew_id": o, "crew_name": crews[o].name, "shared_jobs": n, "by_job_type": dict(counts)})
    out.sort(key=lambda x: -x["shared_jobs"])
    return {"crew_id": crew_id, "job_type": job_type, "pairs": out}
