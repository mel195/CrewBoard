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

app = FastAPI(title="Crew Board API", version="0.5.0",
              description="Backend for Crew Board. Build steps 1 to 5: foundation, settings, crews, clients, jobs, the "
                          "scheduling engine, placements and decisions, messages (logged, not sent), adding jobs from estimates, Plan all, the optimizer and Riley. See the Phase 2 design doc for the full API.")
errors.install(app)
for r in (platform, settings, geo, crews, clients, scheduling, placements, messaging, intake, optimizer, riley):
    app.include_router(r, prefix="/api/v1")


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"ok": True}
