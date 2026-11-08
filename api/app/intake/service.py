"""Intake: bring in an estimate, read it, check it, add the job to the queue. Edit job (ADD-01 to ADD-15)."""
from __future__ import annotations

import json
import pathlib
import uuid
from dataclasses import asdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select, update

from app.audit.service import record
from app.clients.models import Client, ClientSignal
from app.core.config import get_settings
from app.core.context import Ctx, check_version
from app.core.errors import AppError, not_found
from app.core.files import file_store
from app.geo.models import ServiceArea
from app.jobs.models import Job, JobFieldSource, JobLabelLink, JobRevision, JobSkill
from app.scheduling.engine import core as E
from app.scheduling.engine import model as m
from app.scheduling.engine.ranking import rank
from app.scheduling.models import Placement
from app.scheduling.snapshot import business_today, load_snapshot
from app.settings.models import JobLabel, RatingDimension
from app.trades.painting.models import PaintingColor, PaintingJob

from .extract import extract_text, kind_of
from .models import EstimateDocument, IntakeDraft
from .readers import ClaudeReader, ClientHistory, DocumentReader, ai_prompt, mark_text, to_draft

SAMPLES = json.loads(pathlib.Path(__file__).with_name("sample_estimates.json").read_text())
PAINTSCOUT_SAMPLES = {k: v for k, v in SAMPLES.items() if v.get("ps")}
DRAFT_DAYS = 14
LANGS = ("en", "es", "ht", "pt")


def default_reader() -> DocumentReader | None:
    s = get_settings()
    return ClaudeReader(s.anthropic_api_key, s.reader_model) if s.anthropic_api_key else None


# ---------- documents ----------

async def upload(ctx: Ctx, data: bytes, filename: str, mime: str | None) -> EstimateDocument:
    text, pages = extract_text(data, filename, mime)
    key = file_store().put(ctx.tenant_id, data, pathlib.Path(filename).suffix)
    doc = EstimateDocument(tenant_id=ctx.tenant_id, kind="file", filename=filename, mime_type=mime, file_ref=key, size_bytes=len(data),
                           page_count=pages, extracted_text=text, created_by=ctx.membership.id)
    ctx.session.add(doc)
    await ctx.session.flush()
    return doc


async def paste(ctx: Ctx, text: str) -> EstimateDocument:
    if len((text or "").strip()) < 20:
        raise AppError(422, "unreadable_document", "Paste a bit more of the estimate")
    doc = EstimateDocument(tenant_id=ctx.tenant_id, kind="paste", filename="Pasted text", extracted_text=text, created_by=ctx.membership.id)
    ctx.session.add(doc)
    await ctx.session.flush()
    return doc


def paintscout_list(ctx: Ctx) -> list[dict]:
    """Stub until the PaintScout connector exists: demo tenants see the prototype's sample sold estimates."""
    if not ctx.tenant.is_demo:
        return []
    return [{"id": k, "file": v["file"], **{x: v["ps"].get(x) for x in ("client", "area", "value", "sold")}} for k, v in PAINTSCOUT_SAMPLES.items()]


async def paintscout_import(ctx: Ctx, sample_id: str) -> EstimateDocument:
    if not ctx.tenant.is_demo or sample_id not in PAINTSCOUT_SAMPLES:
        raise not_found("Sold estimate")
    s = PAINTSCOUT_SAMPLES[sample_id]
    doc = EstimateDocument(tenant_id=ctx.tenant_id, kind="paintscout", filename=s["file"], extracted_text=s["text"],
                           paintscout={k: v for k, v in s["ps"].items() if k != "sold"}, typed=s.get("human"), created_by=ctx.membership.id)
    ctx.session.add(doc)
    await ctx.session.flush()
    return doc


async def get_document(ctx: Ctx, doc_id: uuid.UUID) -> EstimateDocument:
    d = await ctx.session.get(EstimateDocument, doc_id)
    if not d:
        raise not_found("Document")
    return d


# ---------- reading ----------

async def _dims(ctx: Ctx):
    dims = (await ctx.session.execute(select(RatingDimension).order_by(RatingDimension.sort_order))).scalars().all()
    return dims, [d.key for d in dims if d.kind == "job_type"], [d.key for d in dims if d.kind == "skill"]


async def _areas(ctx: Ctx) -> dict[str, ServiceArea]:
    return {a.name: a for a in (await ctx.session.execute(select(ServiceArea))).scalars()}


async def client_history(ctx: Ctx, name: str | None) -> tuple[Client | None, ClientHistory | None]:
    """Prototype clientByName: exact name, else the same last name. History = returning signal or completed jobs."""
    if not name:
        return None, None
    clients = (await ctx.session.execute(select(Client).where(Client.archived_at.is_(None)))).scalars().all()
    low = name.lower()
    toks = lambda s: [x for x in s.lower().replace("&", " ").split(" ") if x]
    ln = toks(name)[-1] if toks(name) else ""
    c = next((c for c in clients if c.name.lower() == low), None) or next((c for c in clients if ln and ln in toks(c.name)), None)
    if not c:
        return None, None
    sig = (await ctx.session.execute(select(ClientSignal).where(ClientSignal.client_id == c.id))).scalar_one_or_none()
    hist = sig.returning_since if sig and sig.returning_since else None
    if not hist:
        done = (await ctx.session.execute(select(Job).where(Job.client_id == c.id, Job.status == "completed").order_by(Job.finish_by.desc()))).scalars().first()
        if done:
            dim = await ctx.session.get(RatingDimension, done.job_type_id)
            hist = f"{done.finish_by.year} {dim.label.lower()}"
    return c, ClientHistory(client_id=str(c.id), language=c.language, history=hist)


async def read(ctx: Ctx, doc: EstimateDocument, reader: DocumentReader | None) -> IntakeDraft:
    dims, job_types, skills = await _dims(ctx)
    areas = await _areas(ctx)
    today = business_today(ctx.tenant)
    image = None
    if doc.kind == "file" and kind_of(doc.filename, doc.mime_type) == "image":
        image = (file_store().get(doc.file_ref), doc.mime_type or "image/jpeg")
    ai = None
    method = "rules"
    if reader:
        try:
            prompt = ai_prompt(doc.extracted_text, image=bool(image), today=today, job_types=job_types,
                               skills=[(d.key, d.label) for d in dims if d.kind == "skill"])
            ai = await reader.read(prompt, doc.extracted_text, image)
            method = "ai"
            if image and ai.get("sourceText"):
                doc.extracted_text = str(ai["sourceText"])
        except Exception as e:
            ai = None
            if image:
                doc.status, doc.error = "failed", str(e)[:500]
                raise AppError(503, "reader_unavailable", "Reading photos needs the AI reader, which isn’t available right now. Upload a PDF or paste the text.")
    elif image:
        raise AppError(503, "reader_unavailable", "Reading photos needs the AI reader, which isn’t set up here. Upload a PDF or paste the text.")
    text = doc.extracted_text or ""
    d = to_draft(ai, text, method, areas=list(areas), job_types=job_types, skills=skills, today=today,
                 paintscout=doc.paintscout, typed=doc.typed)
    client, hist = await client_history(ctx, d.client)
    if hist:
        d = to_draft(ai, text, method, areas=list(areas), job_types=job_types, skills=skills, today=today,
                     paintscout=doc.paintscout, typed=doc.typed, history=hist)
    admin_labels = {l.name for l in (await ctx.session.execute(select(JobLabel))).scalars()}
    fields = {
        "title": d.title, "client_name": d.client, "client_id": str(client.id) if client else None,
        "area_id": str(areas[d.area].id) if d.area in areas else None, "job_type": d.type, "year_built": d.built,
        "sold_hours": d.hours, "price": d.value, "earliest_start": d.earliest, "finish_by": d.deadline, "colors": d.colors,
        "skills": d.skills, "labels": [l for l in d.labels if l in admin_labels], "language": d.lang, "hoa": d.hoa,
        "important": d.important, "important_reason": d.important_reason,
    }
    sources = {_api_field(k): v for k, v in d.sources.items()}
    doc.status, doc.reader = "read", method
    draft = IntakeDraft(tenant_id=ctx.tenant_id, document_id=doc.id, fields=fields, sources=sources, evidence=d.evidence, reader=method,
                        marked_text=mark_text(text, d.evidence), expires_at=datetime.now(timezone.utc) + timedelta(days=DRAFT_DAYS),
                        created_by=ctx.membership.id)
    ctx.session.add(draft)
    await ctx.session.flush()
    return draft


_FIELD_MAP = {"client": "client_name", "area": "area_id", "type": "job_type", "built": "year_built", "hours": "sold_hours", "value": "price",
              "earliest": "earliest_start", "deadline": "finish_by", "lang": "language"}


def _api_field(k: str) -> str:
    return _FIELD_MAP.get(k, k)


# ---------- drafts ----------

async def get_draft(ctx: Ctx, draft_id: uuid.UUID) -> IntakeDraft:
    d = await ctx.session.get(IntakeDraft, draft_id)
    if not d or d.expires_at < datetime.now(timezone.utc):
        raise not_found("Draft")
    return d


EDITABLE = {"title", "client_name", "client_id", "area_id", "job_type", "year_built", "sold_hours", "price", "earliest_start", "finish_by",
            "colors", "skills", "labels", "language", "hoa", "important", "important_reason"}


async def validate_fields(ctx: Ctx, f: dict) -> None:
    dims, job_types, skills = await _dims(ctx)
    if f.get("job_type") is not None and f["job_type"] not in job_types:
        raise AppError(422, "validation_failed", "Unknown job type", errors=[{"field": "job_type", "message": "unknown job type"}])
    bad = [s for s in f.get("skills") or [] if s not in skills]
    if bad:
        raise AppError(422, "validation_failed", f"Unknown skills: {', '.join(bad)}")
    labels = {l.name for l in (await ctx.session.execute(select(JobLabel))).scalars()}
    bad = [l for l in f.get("labels") or [] if l not in labels]
    if bad:
        raise AppError(422, "validation_failed", f"Only your admin's job labels can be used: {', '.join(bad)}")
    if f.get("area_id") and not await ctx.session.get(ServiceArea, uuid.UUID(str(f["area_id"]))):
        raise not_found("Area")
    if f.get("language") and f["language"] not in LANGS:
        raise AppError(422, "validation_failed", "Unknown language")
    if f.get("important") and not (f.get("important_reason") or "").strip():
        raise AppError(422, "validation_failed", "Add a short reason for flagging the client as important")


async def edit_draft(ctx: Ctx, draft: IntakeDraft, if_match: str | None, changes: dict) -> IntakeDraft:
    check_version(draft.version, if_match)
    if draft.status != "open":
        raise AppError(409, "draft_closed", "This draft was already added or discarded")
    f = dict(draft.fields)
    src = dict(draft.sources)
    for k, v in changes.items():
        if k not in EDITABLE:
            continue
        if f.get(k) != v:
            f[k] = v
            src[k] = "edited"
    if changes.get("hoa") is not None and "HOA" in {l.name for l in (await ctx.session.execute(select(JobLabel))).scalars()}:
        labels = [l for l in (f.get("labels") or []) if l != "HOA"]
        f["labels"] = labels + (["HOA"] if f["hoa"] else [])
    await validate_fields(ctx, f)
    draft.fields, draft.sources = f, src
    draft.version += 1
    return draft


def _transient_job(L, f: dict, area_key: str) -> m.Job:
    idx = lambda s: L.index(date.fromisoformat(s))
    return m.Job(id="__draft", title=f.get("title") or "New job", area=area_key, type=f["job_type"], hours=float(f.get("sold_hours") or 8),
                 earliest=idx(f["earliest_start"]) if f.get("earliest_start") else 0,
                 deadline=idx(f["finish_by"]) if f.get("finish_by") else L.snap.span_horizon, value=float(f.get("price") or 0),
                 region=None, ext=f["job_type"] == "exterior", built=f.get("year_built"), lang=f.get("language") or "en",
                 skills=list(f.get("skills") or []), signals={"manual": f["important_reason"]} if f.get("important") else {})


async def crew_preview(ctx: Ctx, draft: IntakeDraft) -> list:
    """Top 3 crews that could take the job, without saving anything (ADD-11; never written to jobs, G-13)."""
    f = draft.fields
    if not f.get("area_id") or not f.get("job_type"):
        return []
    L = await load_snapshot(ctx)
    area = await ctx.session.get(ServiceArea, uuid.UUID(f["area_id"]))
    from app.geo.models import Region
    reg = await ctx.session.get(Region, area.region_id) if area.region_id else None
    job = _transient_job(L, f, str(area.id))
    job.region = reg.name if reg else None
    L.snap.jobs["__draft"] = job
    rows = [r for r in rank(L.snap, "__draft") if r.ok][:3]
    return [(L, r) for r in rows]


# ---------- commit (ADD-13) ----------

REQUIRED = [("sold_hours", "crew hours"), ("area_id", "area"), ("earliest_start", "earliest start"), ("finish_by", "finish-by date")]


async def commit(ctx: Ctx, draft: IntakeDraft) -> Job:
    if draft.status != "open":
        raise AppError(409, "draft_closed", "This draft was already added or discarded")
    f = draft.fields
    missing = [{"field": k, "message": f"Add the {label}"} for k, label in REQUIRED if not f.get(k)]
    if missing:
        raise AppError(422, "missing_required_fields", "A few things are needed before this job can be added", errors=missing)
    await validate_fields(ctx, f)
    es, fb = date.fromisoformat(f["earliest_start"]), date.fromisoformat(f["finish_by"])
    if fb < es:
        raise AppError(422, "validation_failed", "Finish-by can't be before the earliest start")
    dims, _, _ = await _dims(ctx)
    dim = {d.key: d for d in dims}
    area = await ctx.session.get(ServiceArea, uuid.UUID(f["area_id"]))
    client_id = uuid.UUID(f["client_id"]) if f.get("client_id") else None
    if not client_id and (f.get("client_name") or "").strip():
        c = Client(tenant_id=ctx.tenant_id, name=f["client_name"].strip(), first_name=f["client_name"].strip().split(" ")[0],
                   language=f.get("language") or "en", service_area_id=area.id)
        ctx.session.add(c)
        await ctx.session.flush()
        client_id = c.id
    await ctx.session.execute(update(Job).where(Job.queue_position.is_not(None)).values(queue_position=Job.queue_position + 1))
    doc = await ctx.session.get(EstimateDocument, draft.document_id) if draft.document_id else None
    stamp = datetime.now(timezone.utc).strftime("%b %-d, %-I:%M %p")
    job = Job(tenant_id=ctx.tenant_id, title=f.get("title") or "New job", client_id=client_id, job_type_id=dim[f["job_type"]].id,
              service_area_id=area.id, region_id=area.region_id, sold_hours=max(4, float(f["sold_hours"])), price=f.get("price"),
              earliest_start=es, finish_by=fb, language=f.get("language") or "en",
              important_note=(f.get("important_reason") or "Flagged as important") if f.get("important") else None,
              queue_position=1, write_up=draft.marked_text,
              source_note=f"{doc.filename if doc else 'Estimate'} · added {stamp} · {'read by Riley' if draft.reader == 'ai' else 'read with built-in rules'}",
              photos_count=0)
    ctx.session.add(job)
    await ctx.session.flush()
    for i, s in enumerate(f.get("skills") or []):
        ctx.session.add(JobSkill(tenant_id=ctx.tenant_id, job_id=job.id, dimension_id=dim[s].id, sort_order=i))
    labels = {l.name: l for l in (await ctx.session.execute(select(JobLabel))).scalars()}
    for ln in f.get("labels") or []:
        ctx.session.add(JobLabelLink(tenant_id=ctx.tenant_id, job_id=job.id, job_label_id=labels[ln].id))
    colors = f.get("colors") or []
    ctx.session.add(PaintingJob(tenant_id=ctx.tenant_id, job_id=job.id, year_built=f.get("year_built"), is_exterior=f["job_type"] == "exterior",
                                hoa=bool(f.get("hoa")), colors_status="confirmed" if colors else "tbd"))
    for i, c in enumerate(colors or [{"name": "Color TBD", "hex": "#D9D9D4"}]):
        ctx.session.add(PaintingColor(tenant_id=ctx.tenant_id, job_id=job.id, color_name=c["name"], hex=c.get("hex"), sort_order=i))
    for k, v in draft.sources.items():
        ctx.session.add(JobFieldSource(tenant_id=ctx.tenant_id, job_id=job.id, field=k, source=v, evidence_quote=_quote(draft.evidence, k)))
    draft.status, draft.job_id = "committed", job.id
    await record(ctx, "Import", f"{job.title} added from {doc.filename if doc else 'an estimate'}, "
                                f"{'read by Riley' if draft.reader == 'ai' else 'read with built-in rules'} and checked by {ctx.actor_label}.",
                 entity_type="job", entity_id=job.id, job_id=job.id)
    await ctx.session.flush()
    return job


def _quote(ev: dict, field: str) -> str | None:
    rev = {v: k for k, v in _FIELD_MAP.items()}
    return ev.get(rev.get(field, field)) or ev.get(field)


# ---------- edit job (ADD-15) ----------

JOB_FIELDS = [("title", "Job name"), ("job_type", "Job type"), ("area_id", "Area"), ("sold_hours", "Hours"), ("price", "Price"),
              ("year_built", "Year built"), ("earliest_start", "Earliest start"), ("finish_by", "Finish by"), ("language", "Language")]


async def edit_job(ctx: Ctx, job_id: uuid.UUID, if_match: str | None, changes: dict) -> tuple[Job, list[str]]:
    job = await ctx.session.get(Job, job_id)
    if not job:
        raise not_found("Job")
    check_version(job.version, if_match)
    dims, _, _ = await _dims(ctx)
    by_id = {d.id: d for d in dims}
    by_key = {d.key: d for d in dims}
    p = (await ctx.session.execute(select(PaintingJob).where(PaintingJob.job_id == job.id))).scalar_one_or_none()
    skills = [by_id[s.dimension_id].key for s in (await ctx.session.execute(select(JobSkill).where(JobSkill.job_id == job.id).order_by(JobSkill.sort_order))).scalars()]
    cur = {"title": job.title, "job_type": by_id[job.job_type_id].key, "area_id": str(job.service_area_id), "sold_hours": float(job.sold_hours),
           "price": float(job.price) if job.price is not None else None, "year_built": p.year_built if p else None,
           "earliest_start": job.earliest_start.isoformat(), "finish_by": job.finish_by.isoformat(), "language": job.language,
           "skills": skills, "hoa": bool(p and p.hoa), "important_reason": job.important_note}
    new = {**cur, **{k: v for k, v in changes.items() if k in cur}}
    await validate_fields(ctx, {**new, "important": bool(new.get("important_reason"))})
    if date.fromisoformat(new["finish_by"]) < date.fromisoformat(new["earliest_start"]):
        raise AppError(422, "validation_failed", "Finish-by can't be before the earliest start")
    ch, diff = [], {}
    for k, label in JOB_FIELDS:
        if str(cur[k]) != str(new[k]):
            ch.append(f"{label} {cur[k]} → {new[k]}")
            diff[k] = [cur[k], new[k]]
    if cur["skills"] != new["skills"]:
        ch.append(f"skills now {', '.join(by_key[s].label for s in new['skills']) or 'none'}")
        diff["skills"] = [cur["skills"], new["skills"]]
    if cur["hoa"] != new["hoa"]:
        ch.append("HOA rules on" if new["hoa"] else "HOA rules off")
        diff["hoa"] = [cur["hoa"], new["hoa"]]
    if (cur["important_reason"] or None) != (new["important_reason"] or None):
        ch.append(f"flagged important: {new['important_reason']}" if new["important_reason"] else "removed the important flag")
        diff["important_reason"] = [cur["important_reason"], new["important_reason"]]
    if not ch:
        return job, []
    area = await ctx.session.get(ServiceArea, uuid.UUID(new["area_id"]))
    job.title, job.job_type_id, job.service_area_id, job.region_id = new["title"], by_key[new["job_type"]].id, area.id, area.region_id
    job.sold_hours, job.price, job.language = new["sold_hours"], new["price"], new["language"]
    job.earliest_start, job.finish_by = date.fromisoformat(new["earliest_start"]), date.fromisoformat(new["finish_by"])
    job.important_note = new["important_reason"] or None
    if p:
        p.year_built, p.hoa, p.is_exterior = new["year_built"], new["hoa"], new["job_type"] == "exterior"
    if cur["skills"] != new["skills"]:
        for s in (await ctx.session.execute(select(JobSkill).where(JobSkill.job_id == job.id))).scalars():
            await ctx.session.delete(s)
        await ctx.session.flush()
        for i, s in enumerate(new["skills"]):
            ctx.session.add(JobSkill(tenant_id=ctx.tenant_id, job_id=job.id, dimension_id=by_key[s].id, sort_order=i))
    job.version += 1
    ctx.session.add(JobRevision(tenant_id=ctx.tenant_id, job_id=job.id, version=job.version, changes=diff, changed_by=ctx.membership.id))
    for k in diff:
        fs = (await ctx.session.execute(select(JobFieldSource).where(JobFieldSource.job_id == job.id, JobFieldSource.field == k))).scalar_one_or_none()
        if fs:
            fs.source = "edited"
        else:
            ctx.session.add(JobFieldSource(tenant_id=ctx.tenant_id, job_id=job.id, field=k, source="edited"))
    await ctx.session.flush()
    await _replace_after_edit(ctx, job)
    await record(ctx, "Edit", f"Edited {job.title}: {'; '.join(ch)}.", entity_type="job", entity_id=job.id, job_id=job.id, detail=diff)
    return job, ch


async def _replace_after_edit(ctx: Ctx, job: Job) -> None:
    """Keep the same crew, start and status; recompute the visits for the new hours (prototype setPlace keepSegs)."""
    row = (await ctx.session.execute(select(Placement).where(Placement.job_id == job.id))).scalar_one_or_none()
    if not row:
        return
    L = await load_snapshot(ctx)
    jid = str(job.id)
    ep = L.snap.place.get(jid)
    if not ep:
        return
    new = E.set_place(L.snap, jid, ep.crew, E.place_start(ep), ep.status, True)
    from app.scheduling.service import _save
    await _save(ctx, L, row, new)
    row.version += 1
