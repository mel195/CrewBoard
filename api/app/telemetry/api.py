"""Usage sharing, feedback and the owner's usage report (NAV-04, NAV-07, WS-06 to WS-08).

Usage is only stored for people who said yes (consent is per membership). Events carry page and feature names and
seconds, never client names, phone numbers or prices; the API rejects free text where a name could slip in.
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.context import Ctx, require, tenant_ctx
from app.core.errors import AppError, not_found
from app.platform.models import Membership

from .models import FeedbackItem, UsageEvent, UsageSession

router = APIRouter(tags=["usage"])

NAME = r"^[a-z0-9][a-z0-9_.:-]{0,60}$"   # page and feature keys like "queue", "cal", "optsel"


class ConsentIn(BaseModel):
    consent: bool


@router.put("/me/telemetry-consent", operation_id="me_telemetry_consent_put")
async def consent(body: ConsentIn, ctx: Ctx = Depends(tenant_ctx)):
    ctx.membership.telemetry_consent = body.consent
    return {"consent": body.consent}


class EventIn(BaseModel):
    kind: str = Field(pattern="^(page_time|feature)$")
    page: str | None = Field(None, pattern=NAME)
    feature: str | None = Field(None, pattern=NAME)
    seconds: int = Field(0, ge=0, le=3600)
    count: int = Field(0, ge=0, le=1000)


class EventsIn(BaseModel):
    session_id: uuid.UUID
    role_view: dict[str, int] = {}   # seconds viewing as each role during this batch
    events: list[EventIn] = Field(max_length=200)


@router.post("/usage/events", status_code=204, operation_id="usage_events_post")
async def events(body: EventsIn, ctx: Ctx = Depends(tenant_ctx)):
    """A batch from the browser (the prototype reports every 20 seconds). 403 consent_required unless the person said yes."""
    if ctx.membership.telemetry_consent is not True:
        raise AppError(403, "consent_required", "Usage sharing is off for you")
    for r in body.role_view:
        if r not in ("owner", "admin", "scheduler"):
            raise AppError(422, "validation_failed", f"Unknown role {r}")
    s = await ctx.session.get(UsageSession, body.session_id)
    now = datetime.now(timezone.utc)
    if s is None:
        s = UsageSession(id=body.session_id, tenant_id=ctx.tenant_id, membership_id=ctx.membership.id, role=ctx.membership.role,
                         started_at=now, role_view={})
        ctx.session.add(s)
        await ctx.session.flush()
    elif s.membership_id != ctx.membership.id:
        raise not_found("Session")
    s.last_seen_at = now
    rv = dict(s.role_view or {})
    for r, sec in body.role_view.items():
        rv[r] = rv.get(r, 0) + max(0, min(int(sec), 3600))
    s.role_view = rv
    for e in body.events:
        if e.kind == "page_time" and not e.page or e.kind == "feature" and not e.feature:
            raise AppError(422, "validation_failed", "page_time needs a page and feature needs a feature")
        ctx.session.add(UsageEvent(tenant_id=ctx.tenant_id, session_id=s.id, kind=e.kind, page=e.page, feature=e.feature,
                                   seconds=e.seconds, count=e.count if e.kind == "feature" else 0))


class FeedbackIn(BaseModel):
    page: str = Field(pattern=NAME)
    anchor: str | None = Field(None, max_length=120)
    context: dict = {}
    kind: str = Field("idea", pattern="^(idea|bug|confusing|love)$")
    text: str = Field(max_length=2000)
    pinned: bool = False


class FeedbackOut(BaseModel):
    id: uuid.UUID
    membership_id: uuid.UUID
    member_name: str | None = None
    page: str
    anchor: str | None
    context: dict
    kind: str
    text: str
    pinned: bool
    status: str
    created_at: datetime


def _fb(f: FeedbackItem, names: dict | None = None) -> FeedbackOut:
    return FeedbackOut(id=f.id, membership_id=f.membership_id, member_name=(names or {}).get(f.membership_id), page=f.page, anchor=f.anchor,
                       context=f.context, kind=f.kind, text=f.text, pinned=f.pinned, status=f.status, created_at=f.created_at)


@router.post("/feedback", response_model=FeedbackOut, status_code=201, operation_id="feedback_create")
async def add_feedback(body: FeedbackIn, ctx: Ctx = Depends(tenant_ctx)):
    """Feedback tied to the page and what was open. Doesn't need usage consent: the person is sending it on purpose."""
    if not body.text.strip():
        raise AppError(422, "validation_failed", "Write a note first")
    f = FeedbackItem(tenant_id=ctx.tenant_id, membership_id=ctx.membership.id, page=body.page, anchor=body.anchor,
                     context=body.context, kind=body.kind, text=body.text.strip(), pinned=body.pinned)
    ctx.session.add(f)
    await ctx.session.flush()
    await ctx.session.refresh(f)
    return _fb(f)


class FeedbackPatch(BaseModel):
    status: str = Field(pattern="^(open|done)$")


@router.patch("/feedback/{feedback_id}", response_model=FeedbackOut, operation_id="feedback_update")
async def mark_feedback(feedback_id: uuid.UUID, body: FeedbackPatch, ctx: Ctx = Depends(require("owner"))):
    f = await ctx.session.get(FeedbackItem, feedback_id)
    if not f:
        raise not_found("Feedback")
    f.status = body.status
    f.done_by, f.done_at = (ctx.membership.id, datetime.now(timezone.utc)) if body.status == "done" else (None, None)
    return _fb(f)


@router.get("/usage", operation_id="usage_get")
async def usage(member_id: uuid.UUID | None = None, include_owners: bool = False, ctx: Ctx = Depends(require("owner"))):
    """Owner's report: sessions, time per page, top features, time viewing as each role, and feedback.

    Owners' own sessions are left out by default, like the prototype's "Hide my own sessions".
    """
    members = {m.id: m for m in (await ctx.session.execute(select(Membership))).scalars()}
    def keep(mid):
        m = members.get(mid)
        if member_id:
            return mid == member_id
        return include_owners or not (m and m.role == "owner")
    sessions = [s for s in (await ctx.session.execute(select(UsageSession).order_by(UsageSession.last_seen_at.desc()))).scalars()
                if keep(s.membership_id)]
    sids = {s.id for s in sessions}
    pages, feats, per_session = defaultdict(int), defaultdict(int), defaultdict(int)
    role_view = defaultdict(int)
    for e in (await ctx.session.execute(select(UsageEvent))).scalars():
        if e.session_id not in sids:
            continue
        if e.kind == "page_time":
            pages[e.page] += e.seconds
            per_session[e.session_id] += e.seconds
        elif not e.feature.startswith("go:"):
            feats[e.feature] += e.count
    for s in sessions:
        for r, sec in (s.role_view or {}).items():
            role_view[r] += sec
    fbs = [f for f in (await ctx.session.execute(select(FeedbackItem).order_by(FeedbackItem.created_at.desc()))).scalars()
           if keep(f.membership_id)]
    names = {k: v.display_name for k, v in members.items()}
    return {
        "people": len({s.membership_id for s in sessions}),
        "total_seconds": sum(pages.values()),
        "sessions": [{"id": s.id, "membership_id": s.membership_id, "member_name": names.get(s.membership_id), "role": s.role,
                      "started_at": s.started_at, "last_seen_at": s.last_seen_at, "seconds": per_session[s.id]} for s in sessions],
        "time_per_page": [{"page": p, "seconds": v} for p, v in sorted(pages.items(), key=lambda x: -x[1])],
        "features": [{"feature": k, "count": v} for k, v in sorted(feats.items(), key=lambda x: -x[1])[:15]],
        "time_by_role_view": dict(role_view),
        "feedback": [_fb(f, names) for f in fbs],
    }
