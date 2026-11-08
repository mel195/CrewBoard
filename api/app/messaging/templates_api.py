"""Message templates per language and one-off messages to a client (MSG-05, CLI-05).

Placeholders: {first} {company} {job} {crew} {link}, the prototype's set. Anything else in braces is refused so a
typo never reaches a client. Templates are edited by admins; anyone can use them from a client page.
"""
from __future__ import annotations

import json
import pathlib
import re
import uuid

from fastapi import APIRouter, Depends, Header, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.audit.service import record
from app.clients.models import Client
from app.core import idempotency
from app.core.context import Ctx, check_version, require, tenant_ctx
from app.core.errors import AppError, not_found
from app.crews.models import Crew
from app.jobs.models import Job
from app.scheduling.models import Placement, PlacementCrew
from app.settings.models import MessageTemplate, MessageTemplateText

from .api import MessageOut, message_out
from .models import MessageBatch, OutboundMessage
from .service import company_name, send_batch

router = APIRouter(tags=["messages"])
TOKENS = {"first", "company", "job", "crew", "link"}
LANGS = ("en", "es", "pt", "ht")
LINK_BASE = "https://crewboard.app/c/"
SAMPLE = pathlib.Path(__file__).with_name("sample_templates.json")


def check_tokens(text: str) -> None:
    bad = sorted(set(re.findall(r"\{([^{}]*)\}", text)) - TOKENS)
    if bad:
        raise AppError(422, "unknown_placeholder", f"Unknown placeholder {{{bad[0]}}}. Use {{first}} {{company}} {{job}} {{crew}} {{link}}")


class TemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    recipient_role: str = Field("client", pattern="^(client|crew|pm)$")
    texts: dict[str, str]


class TemplatePatch(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=80)
    texts: dict[str, str] | None = None   # languages given replace their text; an empty text removes that language


class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    recipient_role: str
    texts: dict[str, str]
    version: int


def _validate_texts(texts: dict[str, str], allow_empty: bool = False) -> None:
    for lang, body in texts.items():
        if lang not in LANGS:
            raise AppError(422, "validation_failed", f"Unknown language {lang}")
        if not body.strip() and not allow_empty:
            raise AppError(422, "validation_failed", "Template text can't be blank")
        check_tokens(body)


async def _out(ctx: Ctx, t: MessageTemplate) -> TemplateOut:
    rows = (await ctx.session.execute(select(MessageTemplateText).where(MessageTemplateText.template_id == t.id))).scalars()
    texts = {r.language: r.body for r in rows}
    return TemplateOut(id=t.id, name=t.name, recipient_role=t.recipient_role, texts={l: texts[l] for l in LANGS if l in texts}, version=t.version)


async def _get(ctx: Ctx, tid: uuid.UUID) -> MessageTemplate:
    t = await ctx.session.get(MessageTemplate, tid)
    if not t:
        raise not_found("Template")
    return t


async def seed_templates(session, tenant_id: uuid.UUID) -> None:
    """The prototype's five client templates, for demo workspaces."""
    for i, t in enumerate(json.loads(SAMPLE.read_text())):
        row = MessageTemplate(tenant_id=tenant_id, name=t["name"], recipient_role=t["to"], sort_order=i)
        session.add(row)
        await session.flush()
        for lang, body in t["text"].items():
            session.add(MessageTemplateText(tenant_id=tenant_id, template_id=row.id, language=lang, body=body))


@router.get("/templates", response_model=list[TemplateOut], operation_id="templates_list")
async def list_templates(ctx: Ctx = Depends(tenant_ctx)):
    rows = (await ctx.session.execute(select(MessageTemplate).order_by(MessageTemplate.sort_order, MessageTemplate.name))).scalars().all()
    return [await _out(ctx, t) for t in rows]


@router.post("/templates", response_model=TemplateOut, status_code=201, operation_id="templates_create")
async def create_template(body: TemplateIn, ctx: Ctx = Depends(require("admin"))):
    if not body.texts:
        raise AppError(422, "validation_failed", "Add the text in at least one language")
    _validate_texts(body.texts)
    if (await ctx.session.execute(select(MessageTemplate).where(MessageTemplate.name == body.name))).scalar_one_or_none():
        raise AppError(422, "name_taken", "That name is taken")
    n = len((await ctx.session.execute(select(MessageTemplate.id))).all())
    t = MessageTemplate(tenant_id=ctx.tenant_id, name=body.name, recipient_role=body.recipient_role, sort_order=n)
    ctx.session.add(t)
    await ctx.session.flush()
    for lang, text in body.texts.items():
        ctx.session.add(MessageTemplateText(tenant_id=ctx.tenant_id, template_id=t.id, language=lang, body=text))
    await ctx.session.flush()
    await record(ctx, "Setting", f"Added the message template “{t.name}”.")
    return await _out(ctx, t)


@router.patch("/templates/{template_id}", response_model=TemplateOut, operation_id="templates_update")
async def update_template(template_id: uuid.UUID, body: TemplatePatch, response: Response, if_match: str | None = Header(None),
                          ctx: Ctx = Depends(require("admin"))):
    t = await _get(ctx, template_id)
    check_version(t.version, if_match)
    if body.name and body.name != t.name:
        if (await ctx.session.execute(select(MessageTemplate).where(MessageTemplate.name == body.name))).scalar_one_or_none():
            raise AppError(422, "name_taken", "That name is taken")
        t.name = body.name
    if body.texts:
        _validate_texts(body.texts, allow_empty=True)
        rows = {r.language: r for r in (await ctx.session.execute(select(MessageTemplateText).where(MessageTemplateText.template_id == t.id))).scalars()}
        for lang, text in body.texts.items():
            if not text.strip():
                if lang in rows:
                    await ctx.session.delete(rows.pop(lang))
            elif lang in rows:
                rows[lang].body = text
            else:
                ctx.session.add(MessageTemplateText(tenant_id=ctx.tenant_id, template_id=t.id, language=lang, body=text))
        await ctx.session.flush()
        if not (await ctx.session.execute(select(MessageTemplateText.id).where(MessageTemplateText.template_id == t.id))).first():
            raise AppError(422, "validation_failed", "A template needs text in at least one language")
    t.version += 1
    await record(ctx, "Setting", f"Edited the message template “{t.name}”.")
    response.headers["ETag"] = f'"{t.version}"'
    return await _out(ctx, t)


@router.delete("/templates/{template_id}", status_code=204, operation_id="templates_delete")
async def delete_template(template_id: uuid.UUID, ctx: Ctx = Depends(require("admin"))):
    t = await _get(ctx, template_id)
    await ctx.session.delete(t)
    await record(ctx, "Setting", f"Removed the message template “{t.name}”.")


async def fill(ctx: Ctx, text: str, client: Client, job: Job | None) -> str:
    """Prototype fillT: the client's first name, company, their job, its lead crew, and their client link."""
    crew = None
    if job:
        p = (await ctx.session.execute(select(Placement).where(Placement.job_id == job.id))).scalar_one_or_none()
        if p:
            pc = (await ctx.session.execute(select(PlacementCrew).where(PlacementCrew.placement_id == p.id, PlacementCrew.role == "lead"))).scalar_one_or_none()
            crew = await ctx.session.get(Crew, pc.crew_id) if pc else None
    return (text.replace("{first}", client.first_name or "there").replace("{company}", company_name(ctx))
            .replace("{job}", job.title if job else "your project").replace("{crew}", crew.name if crew else "our")
            .replace("{link}", LINK_BASE + str(client.id)[:8]))


class ClientMessageIn(BaseModel):
    template_id: uuid.UUID | None = None
    job_id: uuid.UUID | None = None
    language: str | None = Field(None, pattern="^(en|es|pt|ht)$")
    channel: str | None = Field(None, pattern="^(text|email|whatsapp)$")
    body: str | None = None   # what to send; without it the template text is used


@router.post("/clients/{client_id}/messages", response_model=MessageOut, status_code=201, operation_id="clients_messages_create")
async def send_to_client(client_id: uuid.UUID, body: ClientMessageIn, request: Request, idempotency_key: str | None = Header(None),
                         ctx: Ctx = Depends(tenant_ctx)):
    """Send one message to a client now, typed or from a template (placeholders filled). Logged like every other message."""
    prev = await idempotency.lookup(ctx, idempotency_key, request.url.path, body.model_dump(mode="json"))
    if prev is not None:
        return prev
    c = await ctx.session.get(Client, client_id)
    if not c or c.archived_at:
        raise not_found("Client")
    job = None
    if body.job_id:
        job = await ctx.session.get(Job, body.job_id)
        if not job or job.client_id != c.id:
            raise not_found("Job")
    else:
        job = (await ctx.session.execute(select(Job).where(Job.client_id == c.id).order_by(Job.created_at.desc()).limit(1))).scalar_one_or_none()
    lang = body.language or c.language
    variants: dict[str, str] = {}
    if body.template_id:
        t = await _get(ctx, body.template_id)
        texts = {r.language: r.body for r in (await ctx.session.execute(select(MessageTemplateText).where(MessageTemplateText.template_id == t.id))).scalars()}
        if lang not in texts:
            raise AppError(422, "language_missing", f"This template has no {lang} text yet")
        variants = {l: await fill(ctx, x, c, job) for l, x in texts.items()}
    text = body.body if body.body is not None else variants.get(lang)
    if not text or not text.strip():
        raise AppError(422, "validation_failed", "Write a message first")
    check_tokens(text)
    text = await fill(ctx, text, c, job)
    b = MessageBatch(tenant_id=ctx.tenant_id, trigger="client", title=f"Message to {c.name}", job_id=job.id if job else None,
                     created_by=ctx.membership.id)
    ctx.session.add(b)
    await ctx.session.flush()
    m = OutboundMessage(tenant_id=ctx.tenant_id, batch_id=b.id, trigger="client", job_id=job.id if job else None,
                        job_title=job.title if job else None, client_id=c.id, recipient_key="client", recipient_role="client",
                        recipient_name=f"{c.name} (client)", channel=body.channel or c.channel, language=lang,
                        languages=sorted(variants) or [lang], variants=variants or {lang: text}, body=text,
                        edited=bool(variants) and text != variants.get(lang), status="draft")
    ctx.session.add(m)
    await ctx.session.flush()
    await send_batch(ctx, b)
    await ctx.session.flush()
    await ctx.session.refresh(m)
    out = message_out(m).model_dump(mode="json")
    await idempotency.store(ctx, idempotency_key, request.url.path, body.model_dump(mode="json"), out)
    return out
