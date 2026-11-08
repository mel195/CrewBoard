"""Riley endpoints (Q-02, MAT-11, MAT-12, RIL-01 to RIL-10)."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from app.core.context import Ctx, require, tenant_ctx
from app.scheduling.placements_api import PlacementOut, placement_out

from . import service as svc

router = APIRouter(tags=["riley"])


@router.get("/assistant", operation_id="assistant_get")
async def summary(ctx: Ctx = Depends(tenant_ctx)):
    """Stage, agreement (overall, by job type, by scheduler), picks for the queue, Riley's own bookings, learners."""
    return await svc.summary(ctx)


class StageIn(BaseModel):
    stage: int = Field(ge=0, le=3)


@router.put("/assistant/stage", operation_id="assistant_stage_put")
async def set_stage(body: StageIn, ctx: Ctx = Depends(require("admin"))):
    out = await svc.set_stage(ctx, body.stage)
    return {**await svc.summary(ctx), **out}


@router.get("/jobs/{job_id}/assistant-pick", operation_id="jobs_assistant_pick_get")
async def pick(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    return await svc.pick_detail(ctx, job_id)


@router.post("/jobs/{job_id}/assistant-pick/accept", response_model=PlacementOut, status_code=201, operation_id="jobs_assistant_pick_accept")
async def accept(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    """Place Riley's pick as a draft. Confirming it needs no reason when it came from a kept habit (BL-35)."""
    p = await svc.accept_pick(ctx, job_id)
    await ctx.session.flush()
    return await placement_out(ctx, p)


@router.post("/assistant/bookings/{job_id}/undo", status_code=204, operation_id="assistant_booking_undo")
async def undo(job_id: uuid.UUID, ctx: Ctx = Depends(tenant_ctx)):
    await svc.undo_booking(ctx, job_id)


class HabitOut(BaseModel):
    id: uuid.UUID
    text: str
    status: str
    source: str
    condition: dict | None
    prefer_crew_id: uuid.UUID | None
    avoid_crew_id: uuid.UUID | None
    evidence_count: int


def habit_out(h) -> HabitOut:
    return HabitOut(id=h.id, text=h.text, status=h.status, source=h.source, condition=h.condition, prefer_crew_id=h.prefer_crew_id,
                    avoid_crew_id=h.avoid_crew_id, evidence_count=h.evidence_count)


@router.get("/assistant/habits", response_model=list[HabitOut], operation_id="assistant_habits_list")
async def habits(ctx: Ctx = Depends(tenant_ctx)):
    return [habit_out(h) for h in await svc.habits(ctx)]


class HabitPatch(BaseModel):
    status: str | None = Field(None, pattern="^(new|kept|ignored)$")
    condition: dict | None = None


@router.patch("/assistant/habits/{habit_id}", response_model=HabitOut, operation_id="assistant_habits_update")
async def update_habit(habit_id: uuid.UUID, body: HabitPatch, ctx: Ctx = Depends(require("admin"))):
    """Keep or ignore a habit; give it a condition (job_type, min_value, skills_any) so it can match jobs."""
    h = await svc.update_habit(ctx, habit_id, body.status, body.condition, "condition" in body.model_fields_set)
    return habit_out(h)


class QuestionOut(BaseModel):
    id: uuid.UUID
    audience: str
    text: str
    options: list[str]
    answer: str | None


@router.get("/assistant/questions", response_model=list[QuestionOut], operation_id="assistant_questions_list")
async def questions(ctx: Ctx = Depends(tenant_ctx)):
    from sqlalchemy import select

    from .models import AssistantQuestion
    qs = (await ctx.session.execute(select(AssistantQuestion).order_by(AssistantQuestion.sort_order))).scalars()
    return [QuestionOut(id=q.id, audience=q.audience, text=q.text, options=q.options, answer=q.answer) for q in qs]


class AnswerIn(BaseModel):
    answer: str


@router.post("/assistant/questions/{question_id}/answer", response_model=QuestionOut, operation_id="assistant_questions_answer")
async def answer(question_id: uuid.UUID, body: AnswerIn, ctx: Ctx = Depends(tenant_ctx)):
    from app.core.errors import AppError

    from .models import AssistantQuestion
    q0 = await ctx.session.get(AssistantQuestion, question_id)
    if q0 and q0.audience == "admin" and ctx.membership.role == "scheduler":
        raise AppError(403, "forbidden", "This question is for an admin")
    q = await svc.answer(ctx, question_id, body.answer)
    return QuestionOut(id=q.id, audience=q.audience, text=q.text, options=q.options, answer=q.answer)


class LearnerIn(BaseModel):
    enabled: bool


@router.put("/assistant/learners/{membership_id}", status_code=204, operation_id="assistant_learners_put")
async def learner(membership_id: uuid.UUID, body: LearnerIn, ctx: Ctx = Depends(require("admin"))):
    await svc.set_learner(ctx, membership_id, body.enabled)


@router.post("/assistant/refresh", status_code=204, operation_id="assistant_refresh")
async def refresh(ctx: Ctx = Depends(require("admin"))):
    """Records that Riley was updated. No model is trained (prototype placeholder, RIL-08)."""
    await svc.refresh(ctx)


class LogRow(BaseModel):
    at: datetime
    scheduler: str
    job_id: uuid.UUID
    job: str | None
    riley_pick: str | None
    picked: str | None
    reason: str
    agreed: bool
    used_in_training: bool


@router.get("/assistant/log", response_model=list[LogRow], operation_id="assistant_log")
async def log(scheduler: str | None = None, ctx: Ctx = Depends(tenant_ctx)):
    return await svc.log(ctx, scheduler)


@router.get("/assistant/log/csv", response_class=PlainTextResponse, operation_id="assistant_log_csv")
async def log_csv(ctx: Ctx = Depends(tenant_ctx)):
    rows = await svc.log(ctx, None)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["When", "Scheduler", "Job", "Riley would pick", "Picked", "Reason", "Used in training"])
    for r in rows:
        w.writerow([r["at"].isoformat(), r["scheduler"], r["job"], r["riley_pick"] or "none", r["picked"], r["reason"], "Yes" if r["used_in_training"] else "No"])
    return PlainTextResponse(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="riley-learning-log.csv"'})
