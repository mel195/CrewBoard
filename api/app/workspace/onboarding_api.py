"""Get started milestones (ONB-01). The prototype marks the first three done in code (G-26); here every milestone is
worked out from the company's own data, in the prototype's order and wording."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select

from app.assistant.models import AssistantObservation
from app.audit.models import AuditEvent
from app.core.context import Ctx, tenant_ctx
from app.crews.api import _load
from app.crews.models import Crew
from app.integrations.models import IntegrationConnection
from app.platform.models import Membership
from app.settings.extra_api import _fields
from app.settings.models import SchedulingRules

router = APIRouter(tags=["workspace"])


class Milestone(BaseModel):
    key: str
    title: str
    status: str          # done | now | next
    detail: str
    action: str | None   # the Setup section or screen to open


class OnboardingOut(BaseModel):
    done: int
    total: int
    milestones: list[Milestone]


def _plural(n: int, w: str) -> str:
    return f"{n} {w}{'' if n == 1 else 's'}"


@router.get("/onboarding", response_model=OnboardingOut, operation_id="onboarding_get")
async def onboarding(ctx: Ctx = Depends(tenant_ctx)):
    s = ctx.session
    connected = (await s.execute(select(func.count()).select_from(IntegrationConnection).where(IntegrationConnection.status == "connected"))).scalar_one()
    crews = await _load(ctx, (await s.execute(select(Crew).where(Crew.archived_at.is_(None)))).scalars().all())
    active = [c for c in crews if c.status == "active"]
    held = [c for c in active if c.missing]
    fields = await _fields(ctx)
    rec = sum(1 for f in fields if f.enabled)
    rules = (await s.execute(select(SchedulingRules))).scalar_one()
    def setting_like(*words):
        q = select(func.count()).select_from(AuditEvent).where(AuditEvent.type == "Setting")
        for w in words:
            q = q.where(AuditEvent.text.ilike(f"%{w}%"))
        return q
    labels_touched = (await s.execute(select(func.count()).select_from(AuditEvent).where(
        AuditEvent.type == "Setting", AuditEvent.text.ilike("%ranking label%")))).scalar_one()
    msgs_touched = (await s.execute(setting_like("messages"))).scalar_one()
    watched = (await s.execute(select(func.count()).select_from(AssistantObservation))).scalar_one()
    schedulers = (await s.execute(select(func.count()).select_from(Membership).where(Membership.tenant_id == ctx.tenant_id, Membership.role == "scheduler"))).scalar_one()

    rows = [
        ("kickoff", "Kickoff", True, "What you’ll need: your crew list (any spreadsheet), PaintScout and CompanyCam logins, and who your schedulers are.", None),
        ("tools", "Connect your tools", connected > 0,
         f"{_plural(connected, 'tool')} connected." if connected else "Connect PaintScout and CompanyCam. A CRM is optional.", "integrations"),
        ("crews", "Bring in your crews", bool(crews),
         f"{_plural(len(crews), 'crew')} in Crew Board. Upload a new file any time." if crews else "Import your crew spreadsheet or add crews by hand.", "crew_import"),
        ("must_haves", "Fill the must-haves", bool(active) and not held,
         f"{_plural(len(held), 'crew')} held back from matching until they have a region, home base and job-type ratings." if held
         else "Every active crew can be matched." if active else "Add crews first.", "crews?needs_info=true"),
        ("fields", "Pick recommended fields", rec >= 3, f"{rec} of {len(fields)} added.", "settings/crew-fields"),
        ("rules", "Rules and rankings", rules.version > 1 or labels_touched > 0,
         "Set the pass-or-fail rules, then choose the top 5 factors for each ranking label.", "settings/rules"),
        ("messages", "Messages", msgs_touched > 0,
         "Choose which calendar changes send messages, to whom, by WhatsApp, text or email, and in which language.", "settings/message-triggers"),
        ("riley", "Meet Riley", watched > 0,
         "Riley starts in Training: it watches and learns from your schedulers, and updates nightly.", "assistant"),
        ("go_live", "Invite schedulers and go live", schedulers > 0, "Add your schedulers. Admins keep setup, labels and the audit log.", "members"),
    ]
    out, now_given = [], False
    for key, title, done, detail, action in rows:
        status = "done" if done else ("next" if now_given else "now")
        now_given = now_given or status == "now"
        out.append(Milestone(key=key, title=title, status=status, detail=detail, action=action))
    return OnboardingOut(done=sum(1 for m in out if m.status == "done"), total=len(out), milestones=out)
