from fastapi import FastAPI

from app.assistant.api import router as riley
from app.clients.api import router as clients
from app.core import errors
from app.crews.api import router as crews
from app.geo.api import router as geo
from app.platform.api import router as platform
from app.intake.api import router as intake
from app.messaging.api import router as messaging
from app.optimizer.api import router as optimizer
from app.scheduling.api import router as scheduling
from app.scheduling.placements_api import router as placements
from app.settings.api import router as settings
from app.integrations.api import router as integrations
from app.audit.api import router as audit
from app.crews.import_api import router as crew_import
from app.messaging.templates_api import router as templates
from app.scheduling.extra_api import router as scheduling_extra
from app.settings.extra_api import router as settings_extra
from app.trades.painting.api import router as painting
from app.telemetry.api import router as telemetry
from app.workspace.api import router as workspace
from app.workspace.onboarding_api import router as onboarding

app = FastAPI(title="Crew Board API", version="0.6.0",
              description="Backend for Crew Board. Build steps 1 to 6: foundation, settings, crews, clients, jobs, the "
                          "scheduling engine, placements and decisions, messages (logged, not sent), adding jobs from estimates, Plan all, the optimizer, Riley, "
                          "usage and feedback, workspace export and import, and integration stubs. See the Phase 2 design doc for the full API.")
errors.install(app)
for r in (platform, settings, settings_extra, geo, crew_import, crews, clients, scheduling_extra, scheduling, placements, messaging, templates, painting, intake, optimizer, riley, telemetry, workspace, onboarding, integrations, audit):
    app.include_router(r, prefix="/api/v1")


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"ok": True}
