from fastapi import FastAPI

from app.clients.api import router as clients
from app.core import errors
from app.crews.api import router as crews
from app.geo.api import router as geo
from app.platform.api import router as platform
from app.scheduling.api import router as scheduling
from app.settings.api import router as settings

app = FastAPI(title="Crew Board API", version="0.1.0",
              description="Backend for Crew Board. Build steps 1 and 2: foundation, settings, crews, clients, jobs, and the "
                          "scheduling engine (ranking, queue, KPIs). See the Phase 2 design doc for the full API.")
errors.install(app)
for r in (platform, settings, geo, crews, clients, scheduling):
    app.include_router(r, prefix="/api/v1")


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"ok": True}
