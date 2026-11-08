# Crew Board

Crew scheduling prototype for PPP (pilot client: Ido). Built as a single-file claude.ai artifact in layers: a base build, then v5 to v9 changes that wrap or replace earlier code.

## Run it

Open `index.html` in a browser. Outside claude.ai it runs on sample data and nothing is saved (saving, telemetry and estimate reading by Claude need the claude.ai artifact runtime).

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Current build (v9, published artifact version 11). Same as `builds/crewboard-v9.html`. |
| `src/base/` | Original source modules: `data.js` (dates, sample jobs, crews, bookings), `engine.js` (state, rules, scoring, ranking), `core.js` (extra job data, work orders), `views1.js` / `views2.js` (screens), `add.js` (Add a job), `ops.js` (helpers), `main.js` (modals, actions, render). |
| `src/layers/` | The changes on top of the base, in load order: `v5.js`, `v6.js`, `v7.js` + `v7.css`, `v8.js` + `v8.css`, `v9.js` + `v9.css`. |
| `src/combined/app.js` | The full app script as it runs in the build (base plus v5 to v8 in one file), extracted from `index.html`. |
| `api/` | Backend (FastAPI + PostgreSQL), build steps 1 and 2: foundation and the scheduling engine with golden parity tests. See `api/README.md`. |
| `builds/` | Earlier published builds: early, v7, v8, v9. |
| `samples/crews-with-ratings.xlsx` | Sample crew spreadsheet for testing the import. |
| `test/mock.js` | Mock `window.claude` db and user, injected to test saving outside claude.ai. |
| `test/*.py` | Playwright scripts used to check builds and take screenshots. They point at sandbox paths; change the file paths before running. |
| `test/screenshots/` | Screenshots from those checks. |

## Version notes

- **v5:** region field, required setup fields
- **v6:** weekends and working hours, essentials setup, KPIs
- **v7:** Oct 26 feedback and Nico's notes: clients, PM handoff, templates, Riley log and "why", tour
- **v8:** cut the fat (Ido's comment): simpler queue, work order card, setup
- **v9:** saved workspace, members (admin / scheduler master view), telemetry, feedback tied to the exact page, owner Usage tab

## Links

Live prototype: https://claude.ai/code/artifact/d25d3f9e-cdb6-4237-a9ae-bd1a41ea6e69
