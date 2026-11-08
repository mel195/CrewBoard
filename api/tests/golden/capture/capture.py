"""Capture golden fixtures from the Crew Board prototype.

Runs the prototype's own engine functions in headless Chromium over its sample data
and a few variant scenarios, and writes inputs + outputs to tests/golden/fixtures/*.json.
The Python engine must reproduce these outputs exactly.

Usage: python capture.py <path-to-prototype-index.html> <fixtures-dir>
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

# Runs inside the page. Serializes the state the engine reads, then runs the engine.
JS = r"""
(scn) => {
  const strip = r => ({crew: r.crew, ok: r.ok, fails: r.fails, slot: r.slot, f: r.f, score: r.score, needsRating: r.needsRating});
  const reset = () => {
    for (const k in S.place) delete S.place[k];
    for (const k in S.shift) delete S.shift[k];
    for (const k in S.reassign) delete S.reassign[k];
    S.w = {}; S.label = {}; S.ofb = {reject: {}, pin: {}, noMove: {}, block: []};
    S.optWin = {range: '2w', from: 0, to: 13}; S.optAll = false; S.optMargin = false; S.lock = 5;
  };
  reset();
  // ----- scenario setup -----
  if (scn.rules) Object.assign(S.rules, scn.rules);
  if (scn.optWin) S.optWin = scn.optWin;
  if (scn.optAll) S.optAll = true;
  if (scn.optMargin) S.optMargin = true;
  if (scn.lock) S.lock = scn.lock;
  if (scn.labels) Object.assign(S.label, scn.labels);
  if (scn.weights) Object.assign(S.w, scn.weights);
  if (scn.place) scn.place.forEach(([jid, crew, s, status, extra]) => setPlace(jid, crew, s, status, false, extra || []));
  if (scn.split) scn.split.forEach(jid => splitVisits(jid));
  if (scn.shift) Object.assign(S.shift, scn.shift);
  if (scn.reassign) Object.assign(S.reassign, scn.reassign);
  if (scn.crewEdits) scn.crewEdits.forEach(([cid, path, val]) => { const c = crewById(cid); const ks = path.split('.'); let o = c; ks.slice(0, -1).forEach(k => o = o[k]); o[ks.at(-1)] = val; });

  // ----- inputs -----
  const learned = S.riley.learned.map(x => ({id: x.id, text: x.text, crew: x.crew || null, avoid: x.avoid || null, n: x.n, status: x.status,
    matches: Object.fromEntries(QORDER.map(j => [j, !!x.test(JOBS[j])]))}));
  const inputs = JSON.parse(JSON.stringify({
    DL: DL.map(d => ({iso: d.iso, dow: d.dow, m: d.m, n: d.n})), CREWS, JOBS: Object.fromEntries(QORDER.map(j => [j, JOBS[j]])), QORDER, BOOKS,
    shift: S.shift, reassign: S.reassign, place: S.place, rules: S.rules, impOn: S.impOn, impValue: S.impValue, hoursDefault: S.hoursDefault,
    label: S.label, w: S.w, lock: S.lock, optWin: S.optWin, optAll: S.optAll, optMargin: S.optMargin, ofb: S.ofb,
    LABELS, DIMS, WX, GEO, HIST, AVG_COST, LANGS, RECOMMENDED: RECOMMENDED.map(f => ({k: f.k, added: !!f.added})), learned
  }));

  // ----- outputs -----
  const out = {};
  const active = activeCrews().map(c => c.id);
  out.dayCap = Object.fromEntries(CREWS.map(c => [c.id, [...Array(42).keys()].map(d => dayCap(c.id, d))]));
  out.ready = Object.fromEntries(CREWS.map(c => [c.id, {ready: ready(c), missing: missing(c)}]));
  out.bookings = bookings();
  out.jobs = {};
  QORDER.forEach(jid => {
    const job = JOBS[jid]; const B = bookings(jid);
    const R = rank(jid);
    const o = {rank: R.map(strip), weights: weights(jid), label: labelFor(jid), imp: imp(job), impWhy: impWhy(job),
      rileyPick: rileyPick(jid), why: R.map(r => whyLines(job, r)), margin: Object.fromEntries(active.map(c => [c, margin(jid, c)])),
      crewPay: Object.fromEntries(active.map(c => [c, crewPay(job, c)])), driveMin: Object.fromEntries(CREWS.map(c => [c.id, driveMin(c.f.base, job.area)])),
      need: Object.fromEntries(active.map(c => [c, need(job, c, [])])), spans: [], earliest: {}};
    active.forEach(c => {
      o.earliest[c] = earliestSlot(job, c, B);
      for (let s = job.earliest; s <= job.earliest + 4; s++) o.spans.push({crew: c, start: s, extra: [], span: span(job, c, s, B, [])});
    });
    // two-crew spans
    for (let i = 0; i + 1 < Math.min(active.length, 8); i += 2) o.spans.push({crew: active[i], start: job.earliest, extra: [active[i + 1]], span: span(job, active[i], job.earliest, B, [active[i + 1]])});
    if (S.place[jid]) o.placement = {place: S.place[jid], days: placeDays(jid), conf: placeConf(jid)};
    out.jobs[jid] = o;
  });
  out.kpiSched = kpiSched(); out.kpiWaiting = kpiWaiting(); out.openDays = openDays(); out.openDays4w = openDays(bookings(), 0, 27);
  // optimizer (pure: restores state)
  const m = optimize(); delete m.at; out.optimize = JSON.parse(JSON.stringify(m));
  // plan all (mutates: capture then let the caller reload)
  const saved = JSON.parse(JSON.stringify(S.place));
  planAll(); out.planAll = JSON.parse(JSON.stringify({items: S.modal.items, skipped: S.modal.skipped, place: S.place})); S.modal = null;
  for (const k in S.place) delete S.place[k]; Object.assign(S.place, saved);
  return {name: scn.name, inputs, outputs: JSON.parse(JSON.stringify(out))};
}
"""

SCENARIOS = [
    {"name": "base"},
    {"name": "margin_4w", "optMargin": True, "optWin": {"range": "4w", "from": 0, "to": 27}},
    {"name": "all_crews", "optAll": True},
    {"name": "rules_relaxed", "rules": {"minReviews": 1, "region": False, "weather": False, "lead": False}},
    {"name": "rules_strict", "rules": {"minType": 4, "maxDrive": 25, "impBar": 5, "untested": True}},
    {"name": "placed_drafts", "place": [["hernandez", "gian", 7, "draft"], ["okafor", "rigo", 3, "scheduled", ["tania"]]], "split": ["hernandez"]},
    {"name": "shifted_books", "shift": {"b0": 2, "b3": 1}, "reassign": {"b1": "rigo"}, "lock": 3},
    {"name": "labels_weights", "labels": {"hernandez": "Fastest start", "patel": "Protect margin"}, "weights": {"okafor": {"timing": 5, "distance": 3, "language": 2}}},
    {"name": "weekend_hours", "crewEdits": [["gian", "f.hours", {"wk": ["07:00", "15:30"], "sat": ["08:00", "14:00"], "sun": None}], ["rigo", "f.hours", {"wk": ["08:00", "13:00"], "sat": None, "sun": ["09:00", "13:00"]}]]},
]


async def main(html: str, out_dir: str) -> None:
    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for scn in SCENARIOS:
            page = await browser.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            await page.goto("file://" + html)
            await page.wait_for_timeout(1200)
            data = await page.evaluate(JS, scn)
            if errors:
                raise SystemExit(f"{scn['name']}: page errors {errors}")
            (out / f"{scn['name']}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
            print(scn["name"], "ok")
            await page.close()
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
