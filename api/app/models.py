"""Import every module's models so Alembic and tests see the full metadata."""
from app.assistant.models import (AssistantHabit, AssistantLearner, AssistantObservation, AssistantQuestion,  # noqa: F401
                                  AssistantState)
from app.optimizer.models import OptimizerMove, OptimizerRun  # noqa: F401
from app.core.idempotency import IdempotencyKey  # noqa: F401
from app.messaging.models import MessageBatch, OutboundMessage  # noqa: F401
from app.audit.models import AuditEvent  # noqa: F401
from app.clients.models import Client, ClientSignal, FollowUp  # noqa: F401
from app.core.db import Base  # noqa: F401
from app.crews.models import Crew, CrewCostPeriod, CrewHours, CrewMember, CrewRating  # noqa: F401
from app.geo.models import Region, ServiceArea  # noqa: F401
from app.intake.models import EstimateDocument, IntakeDraft  # noqa: F401
from app.jobs.models import Job, JobFieldSource, JobLabelLink, JobRanking, JobRevision, JobSkill  # noqa: F401
from app.platform.models import AppUser, Membership, Tenant  # noqa: F401
from app.scheduling.models import PlanAllRun, Placement, PlacementCrew, PlacementVisit, SchedulingDecision  # noqa: F401
from app.settings.models import (DefaultHours, ImportantTrigger, JobLabel, MessageTrigger, ProjectManager,  # noqa: F401
                                 RankingLabel, RankingLabelWeight, RatingDimension, SchedulingRules)
from app.trades.painting.models import PaintingColor, PaintingJob  # noqa: F401
from app.weather.models import WeatherDay  # noqa: F401

SCHEMAS = ["platform", "config", "ops", "painting", "comms", "audit", "shared", "system"]

# Tables with tenant_id that get row-level security. membership is included; app_user and tenant are not.
TENANT_TABLES = sorted(
    f"{t.schema}.{t.name}" for t in Base.metadata.sorted_tables if "tenant_id" in t.c and t.schema != "shared"
)
APPEND_ONLY = ["audit.audit_event", "ops.scheduling_decision"]
