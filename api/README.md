# Crew Board API

Backend for Crew Board, built to the Phase 2 design (modular monolith: Python 3.13, FastAPI, Pydantic v2,
SQLAlchemy 2, Alembic, PostgreSQL 17 + PostGIS).

This covers **build steps 1 to 4** of the design's build order:

1. Foundation: tenancy with row-level security, platform (users, members, roles), settings, geography, crews,
   clients, jobs, painting job details, audit log, demo-tenant seed.
2. The scheduling engine, ported from the prototype as pure functions and proven identical with golden tests.
3. Placements and decisions: place a draft (best crew or a manual pick with a reason), drag to a day or crew,
   second crews, split and resize visits, project manager and handoff, confirm (reason rule, score snapshot, Riley
   observation), move a confirmed job (reason required), unschedule, clear, calendar, decision history. Messages:
   every decision builds a review batch in the recipient's language (texts identical to the prototype), edit text,
   channel or language, send or skip, message log, trigger settings. Sending is log-only until a provider is chosen.

4. Adding jobs from estimates: upload a PDF, Word file, photo or text, or paste it; read it with the AI reader
   (Claude, when `CREWBOARD_ANTHROPIC_API_KEY` is set) or the built-in rules reader; every field shows where it came
   from (PaintScout, typed, AI, rules, client history, edited, missing); client history fills only language and the
   important flag; edit the draft, see the 3 best crews, add it to the top of the queue. PaintScout is a stub with
   the prototype's sample sold estimates for demo workspaces. Edit job keeps every change as a revision and
   re-plans a placed job with the same crew and start.

Plan all and optimizer endpoints, and Riley's settings are steps 5 and 6. The engine for Plan all, the
optimizer and Riley's pick is already ported and tested; only their endpoints are left.

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
- `tests/golden/test_messages_parity.py`: every message text (crew lead, client, HOA, PM, color confirmations,
  shifted bookings) in every language matches the prototype (`capture_messages.py`).
- `tests/golden/test_intake_parity.py`: the rules reader, the field merge and the marked write-up match the
  prototype on its 5 sample estimates and 6 more texts (`capture_intake.py`). Three intentional changes: any month
  works (the prototype only read Oct to Dec 2026), the longest area name wins ("Miami Beach", not "Miami"), and
  fields found by the rules reader are marked `rules`, not `ai`.
- `tests/api/test_intake.py`: paste, PDF, Word, photo (needs the AI reader), a fake AI reader, AI failure falling
  back to rules, required fields, Color TBD, client history, PaintScout import, idempotent commit, edit job.
- `tests/api/test_placements.py`: place, confirm with and without a reason, Riley learning, idempotent confirm,
  message edit and send, drag, non-working days, version conflicts, second crew, split, PM handoff, move with a
  reason, unschedule, append-only decisions, review-off sending, calendar.
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
