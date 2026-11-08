"""Capture the prototype's estimate reading (ruleRead, toDraft, markText) for golden tests.

Usage: python capture_intake.py <prototype index.html> <out dir>
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

EXTRA = [
    "Client: Maria Lopez\nKitchen cabinets refinish, 40 labor hours. Total: $5,200. Start after Nov 9, finish by Nov 20. Customer prefers Spanish.",
    "Customer: Beacon Office Park\nCommercial office repaint, two floors. 160 hours. Price $24,800. Need it done before Dec 4. Earliest start: Nov 16.",
    "Jean Baptiste residence, Miami. Built 1962. Exterior stucco and fascia, pressure wash and patch cracks, spray body. Colors: Naval and Extra White. "
    "HOA approval pending. Mrs. Baptiste speaks Creole. Labor 88 hrs. Total $9,900. Returning client, referred by the Lees.",
    "Wallpaper install in the powder room, Coral Gables. 12 hours. Total $1,450. Starting Nov 3. Designer: Ava Studio, very particular about seams.",
    "Interior repaint, 3 bedrooms. Cabinets not included. Doral. Built in 1999. 30 hrs. Total: $3,100. Colors Agreeable Gray, Alabaster.",
    "Venetian plaster accent wall, Miami Beach. VIP client. 20 hours. price: $4,000 by Dec 12",
]

JS = r"""
(extra) => {
  const out = {samples: {}, extra: [], KNOWN, AREAS, MARK: typeof MARK !== 'undefined' ? MARK : null,
               isoToIdx: isoToIdx.toString(), hashColor: hashColor.toString(), clientByName: clientByName.toString(),
               CLIENTS: CLIENTS.map(c => ({id: c.id, name: c.name, lang: c.lang, past: c.past})), DIMS};
  const pack = (text, smp) => {
    const r = ruleRead(text); const d = toDraft(null, text, 'rules', smp);
    return {text, rule: r, draft: d, marked: markText(text, d.ev)};
  };
  Object.entries(SAMPLES).forEach(([k, s]) => out.samples[k] = {file: s.file, ps: s.ps || null, human: s.human || null, ...pack(s.text, s)});
  extra.forEach(t => out.extra.push(pack(t, null)));
  return JSON.parse(JSON.stringify(out));
}
"""


async def main(html, out_dir):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto("file://" + html)
        await pg.wait_for_timeout(1200)
        data = await pg.evaluate(JS, EXTRA)
        pathlib.Path(out_dir).mkdir(parents=True, exist_ok=True)
        pathlib.Path(out_dir, "intake.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
        print(len(data["samples"]), "samples,", len(data["extra"]), "extra")
        await b.close()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
