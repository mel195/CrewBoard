# Crew Board API

Backend for Crew Board, built to the Phase 2 design (modular monolith: Python 3.13, FastAPI, Pydantic v2,
SQLAlchemy 2, Alembic, PostgreSQL 17 + PostGIS).

This is **build steps 1 and 2** of the design's build order:

1. Foundation: tenancy with row-level security, platform (users, members, roles), settings, geography, crews,
   clients, jobs, painting job details, audit log, demo-tenant seed.
2. The scheduling engine, ported from the prototype as pure functions and proven identical with golden tests.

Placements (place, drag, confirm, move), messages, intake, Plan all and optimizer endpoints, and Riley's
learning are steps 3 to 6. The engine for Plan all, the optimizer and Riley's pick is already ported and tested;
only their write endpoints are left.

## Run it

```bash
cd api
docker compose up --build          # Postgres 17 + PostGIS on :5432, API on :8000
open http://localhost:8000/docs    # OpenAPI UI
```

Create a demo workspace seeded with the prototype's sample data (dev only):

```bash
curl -X POST localhost:8000/api/v1/dev/demo-tenant -H 'X-Dev-User: you@example.com' -H 'content-type: application/json' -d '{}'
# then call anything with:  -H 'X-Dev-User: you@example.com' -H 'X-Tenant-Id: <tenant_id from the response>'
curl localhost:8000/api/v1/queue -H 'X-Dev-User: you@example.com' -H 'X-Tenant-Id: <id>'
```

Demo workspaces pin "today" to the prototype's first calendar day (Mon Oct 26 2026), so the queue and rankings
match the prototype exactly. Real workspaces use real dates in their time zone.

## Tests

```bash
pip install ".[dev]"
pytest tests/golden          # engine parity, no database needed
pytest                       # everything; needs the database (docker compose up db, plus the env vars in .env.example)
```

- `tests/golden/`: 90 checks across 9 scenarios. Fixtures were captured by running the prototype's own functions
  (`rank`, `span`, `earliestSlot`, `planAll`, `optimize`, `rileyPick`, `kpiSched`, `whyLines`, ...) in headless
  Chromium. Every score, slot, failure message, reason line, optimizer move and KPI must match.
  To recapture after a prototype change: `python tests/golden/capture/capture.py ../index.html tests/golden/fixtures`
  (needs Playwright).
- `tests/api/`: the seeded demo tenant ranks identically through the database and API; tenant isolation
  (API and raw SQL under row-level security); roles; If-Match concurrency; validation errors; append-only audit.

## Layout

| Path | What |
| --- | --- |
| `app/core` | Config, database and tenant-scoped sessions, auth context and roles, problem+json errors |
| `app/scheduling/engine` | Pure engine: `core.py` (capacity, bookings, spans, slots, split/rebalance), `ranking.py` (rules, factors, score, rank, why lines), `planning.py` (Plan all, KPIs, open days), `prototype.py` (load prototype state) |
| `app/optimizer/engine.py` | Optimizer, margin, crew pay |
| `app/assistant/engine.py` | Riley's pick with structured habit conditions |
| `app/scheduling/snapshot.py` | Loads one tenant's data from the database into an engine snapshot |
| `app/*/models.py`, `app/*/api.py` | Tables and endpoints per module |
| `app/workspace/demo.py` | Demo-tenant seed from the prototype's sample data |
| `migrations/` | Alembic; the initial migration also creates schemas, row-level security policies and grants |
| `deploy/init.sql` | Database roles and PostGIS, run once per database |

## Security notes

- The app connects as `crewboard_app`, which is subject to row-level security on every tenant table. Migrations
  run as `crewboard`, the owner.
- Auth is `dev` mode (an `X-Dev-User` header) until the identity provider is chosen (Phase 2 TQ-01). Dev mode is
  refused in staging and production.
- Audit events can't be updated or deleted by the app role.

## Notes on parity

A few prototype behaviors are kept on purpose so results match, and are flagged in code:

- The "null min drive" text when a crew has no home base.
- KPI value counting where an extra crew's booking overwrites the job's value with 0.
- Ratings allow half points (for example 3.5), as in the sample data.
