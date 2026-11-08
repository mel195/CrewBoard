"""Add a job: upload or paste an estimate, read it, check it, add to the queue; PaintScout (stub); edit job."""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, File, Header, Request, Response, UploadFile
from pydantic import BaseModel, Field

from app.core import idempotency
from app.core.context import Ctx, tenant_ctx
from app.core.errors import not_found
from app.scheduling.api import RankRowOut, _row

from app.integrations.paintscout import EstimateSource, get_estimate_source

from . import service as svc
from .readers import DocumentReader

router = APIRouter(tags=["intake"])


def get_reader() -> DocumentReader | None:
    """Overridable dependency (tests inject a fake reader)."""
    return svc.default_reader()


class DocumentOut(BaseModel):
    id: uuid.UUID
    kind: str
    filename: str
    status: str
    page_count: int | None
    text_length: int


def doc_out(d) -> DocumentOut:
    return DocumentOut(id=d.id, kind=d.kind, filename=d.filename, status=d.status, page_count=d.page_count, text_length=len(d.extracted_text or ""))


class Color(BaseModel):
    name: str
    hex: str | None = None


class DraftFields(BaseModel):
    title: str | None = None
    client_name: str | None = None
    client_id: uuid.UUID | None = None
    area_id: uuid.UUID | None = None
    job_type: str | None = None
    year_built: int | None = Field(None, ge=1700, le=2100)
    sold_hours: float | None = Field(None, gt=0)
    price: float | None = Field(None, ge=0)
    earliest_start: date | None = None
    finish_by: date | None = None
    colors: list[Color] | None = None
    skills: list[str] | None = None
    labels: list[str] | None = None
    language: str | None = Field(None, pattern="^(en|es|ht|pt)$")
    hoa: bool | None = None
    important: bool | None = None
    important_reason: str | None = None


class DraftOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID | None
    status: str
    reader: str
    fields: dict
    sources: dict
    evidence: dict
    marked_text: str | None
    job_id: uuid.UUID | None
    version: int


def draft_out(d) -> DraftOut:
    return DraftOut(id=d.id, document_id=d.document_id, status=d.status, reader=d.reader, fields=d.fields, sources=d.sources,
                    evidence=d.evidence, marked_text=d.marked_text, job_id=d.job_id, version=d.version)


@router.post("/estimate-documents", response_model=DocumentOut, status_code=201, operation_id="estimate_documents_upload")
async def upload(file: UploadFile = File(...), ctx: Ctx = Depends(tenant_ctx)):
    """Upload a PDF, Word file, photo or text file (ADD-01). Text is pulled out right away; unreadable files are refused."""
    return doc_out(await svc.upload(ctx, await file.read(), file.filename or "estimate", file.content_type))


class PasteIn(BaseModel):
    text: str


@router.post("/estimate-documents/text", response_model=DocumentOut, status_code=201, operation_id="estimate_documents_paste")
async def paste(body: PasteIn, ctx: Ctx = Depends(tenant_ctx)):
    return doc_out(await svc.paste(ctx, body.text))


@router.post("/estimate-documents/{doc_id}/read", response_model=DraftOut, status_code=201, operation_id="estimate_documents_read")
async def read(doc_id: uuid.UUID, response: Response, ctx: Ctx = Depends(tenant_ctx), reader: DocumentReader | None = Depends(get_reader)):
    """Read the estimate into a draft: AI reader when set up, else the built-in rules (ADD-06 to ADD-08)."""
    d = await svc.read(ctx, await svc.get_document(ctx, doc_id), reader)
    response.headers["ETag"] = f'"{d.version}"'
    return draft_out(d)


@router.get("/paintscout/sold-estimates", operation_id="paintscout_list")
async def paintscout(ctx: Ctx = Depends(tenant_ctx), source: EstimateSource = Depends(get_estimate_source)):
    """Sold estimates from PaintScout. Empty until the connector is built."""
    items = await source.sold_estimates(ctx)
    return [{"id": x["id"], "file": x["file"], **{k: x["ps"].get(k) for k in ("client", "area", "value", "sold")}} for x in items]


@router.post("/paintscout/sold-estimates/{estimate_id}/import", response_model=DraftOut, status_code=201, operation_id="paintscout_import")
async def paintscout_import(estimate_id: str, ctx: Ctx = Depends(tenant_ctx), reader: DocumentReader | None = Depends(get_reader),
                            source: EstimateSource = Depends(get_estimate_source)):
    """503 connector_not_connected until PaintScout is connected."""
    item = await source.estimate(ctx, estimate_id)
    if not item:
        raise not_found("Sold estimate")
    doc = await svc.paintscout_import(ctx, item)
    return draft_out(await svc.read(ctx, doc, reader))


@router.get("/intake-drafts/{draft_id}", response_model=DraftOut, operation_id="intake_drafts_get")
async def get_draft(draft_id: uuid.UUID, response: Response, ctx: Ctx = Depends(tenant_ctx)):
    d = await svc.get_draft(ctx, draft_id)
    response.headers["ETag"] = f'"{d.version}"'
    return draft_out(d)


@router.patch("/intake-drafts/{draft_id}", response_model=DraftOut, operation_id="intake_drafts_update")
async def edit_draft(draft_id: uuid.UUID, body: DraftFields, response: Response, if_match: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    """Edit fields; each edited field is marked `edited` (ADD-09, ADD-10)."""
    changes = body.model_dump(mode="json", exclude_unset=True)
    d = await svc.edit_draft(ctx, await svc.get_draft(ctx, draft_id), if_match, changes)
    response.headers["ETag"] = f'"{d.version}"'
    return draft_out(d)


@router.get("/intake-drafts/{draft_id}/crew-preview", response_model=list[RankRowOut], operation_id="intake_drafts_crew_preview")
async def crew_preview(draft_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    rows = await svc.crew_preview(ctx, await svc.get_draft(ctx, draft_id))
    return [_row(L, "__draft", r) for L, r in rows]


class CommitOut(BaseModel):
    job_id: uuid.UUID
    title: str
    queue_position: int


@router.post("/intake-drafts/{draft_id}/commit", response_model=CommitOut, status_code=201, operation_id="intake_drafts_commit")
async def commit(draft_id: uuid.UUID, request: Request, idempotency_key: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    """Add to the queue (ADD-13). Needs crew hours, area, earliest start and finish by."""
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, {})
    if prev is not None:
        return prev
    job = await svc.commit(ctx, await svc.get_draft(ctx, draft_id))
    out = CommitOut(job_id=job.id, title=job.title, queue_position=job.queue_position).model_dump(mode="json")
    await idempotency.store(ctx, idempotency_key, request.url.path, {}, out)
    return out


@router.post("/intake-drafts/{draft_id}/discard", status_code=204, operation_id="intake_drafts_discard")
async def discard(draft_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    d = await svc.get_draft(ctx, draft_id)
    if d.status == "open":
        d.status = "discarded"


class JobEdit(BaseModel):
    title: str | None = Field(None, min_length=1)
    job_type: str | None = None
    area_id: uuid.UUID | None = None
    sold_hours: float | None = Field(None, gt=0)
    price: float | None = Field(None, ge=0)
    year_built: int | None = Field(None, ge=1700, le=2100)
    earliest_start: date | None = None
    finish_by: date | None = None
    language: str | None = Field(None, pattern="^(en|es|ht|pt)$")
    skills: list[str] | None = None
    hoa: bool | None = None
    important_reason: str | None = None


class JobEditOut(BaseModel):
    job_id: uuid.UUID
    version: int
    changes: list[str]


@router.patch("/jobs/{job_id}", response_model=JobEditOut, operation_id="jobs_update")
async def edit_job(job_id: uuid.UUID, body: JobEdit, response: Response, if_match: str | None = Header(None), ctx: Ctx = Depends(tenant_ctx)):
    """Edit a job: every change is logged and kept as a revision; a placed job is re-planned with the same crew and start (ADD-15)."""
    job, ch = await svc.edit_job(ctx, job_id, if_match, body.model_dump(mode="json", exclude_unset=True))
    response.headers["ETag"] = f'"{job.version}"'
    return JobEditOut(job_id=job.id, version=job.version, changes=ch)
