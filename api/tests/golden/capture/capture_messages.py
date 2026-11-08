"""Capture the prototype's message texts (buildMsgs, buildFixedMsgs, colorMsgs) for golden tests.

Usage: python capture_messages.py <prototype index.html> <fixtures dir>
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

JS = r"""
() => {
  const out = {cases: [], fixed: [], colors: []};
  const scen = [
    // jid, crew, start, extra, pm, colorsOk override, msgLang
    ['hernandez', 'gian', 7, [], 'bo', null, null],
    ['okafor', 'rigo', 3, ['tania'], 'alan', false, null],
    ['patel', 'tania', 5, [], null, 'sent', 'es'],
    ['gutierrez', 'johan-dani', 3, ['gian'], 'bo', false, 'ht'],
  ];
  scen.forEach(([jid, crew, s, extra, pm, colorsOk, ml]) => {
    if (colorsOk !== null) JOBS[jid].colorsOk = colorsOk;
    setPlace(jid, crew, s, 'draft', false, extra);
    if (pm) S.place[jid].pm = pm;
    if (ml) S.msgLang[jid] = ml;
  });
  scen.forEach(([jid]) => {
    ['confirm', 'move', 'cancel', 'reminder', 'rain'].forEach(trig => {
      const ms = buildMsgs(jid, trig).map(m => ({key: m.key, role: m.role, to: m.to, channel: m.channel, lang: m.lang,
        text: m.text, all: Object.fromEntries((m.langs || [m.lang]).map(l => [l, m.gen(l)]))}));
      out.cases.push({jid, trigger: trig, msgs: ms});
    });
    out.colors.push({jid, msgs: colorMsgs(jid).map(m => ({key: m.key, role: m.role, to: m.to, channel: m.channel, lang: m.lang, text: m.text,
      all: Object.fromEntries((m.langs || [m.lang]).map(l => [l, m.gen(l)]))}))});
  });
  BOOKS.slice(0, 8).forEach(b => ['move', 'cancel'].forEach(trig => out.fixed.push({id: b.id, trigger: trig,
    msgs: buildFixedMsgs(b, trig).map(m => ({key: m.key, role: m.role, to: m.to, channel: m.channel, lang: m.lang, text: m.text,
      all: Object.fromEntries(m.langs.map(l => [l, m.gen(l)]))}))})));
  out.scenario = scen;
  out.jobs = Object.fromEntries(QORDER.map(j => [j, {client: JOBS[j].client, colors: JOBS[j].colors, colorsOk: JOBS[j].colorsOk, hoa: JOBS[j].hoa}]));
  out.place = JSON.parse(JSON.stringify(S.place));
  out.PMS = PMS; out.COMPANY = COMPANY;
  out.crews = Object.fromEntries(CREWS.map(c => [c.id, {clang: c.f.clang || null, channel: c.f.channel || null, phone: c.f.phone || null}]));
  return out;
}
"""


async def main(html, out_dir):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto("file://" + html)
        await pg.wait_for_timeout(1200)
        data = await pg.evaluate(JS)
        pathlib.Path(out_dir, "messages.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
        print("cases", len(data["cases"]), "fixed", len(data["fixed"]))
        await b.close()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
