"""Reading estimates: the built-in rules reader, the AI reader interface, and merging results into a draft.

Ported from the prototype's ruleRead, aiRead, toDraft, clientHistoryFill and markText (ADD-06 to ADD-08, BL-56, BL-57).
Changes from the prototype, recorded as design decisions:
- Dates: the prototype only understood Oct to Dec 2026. Here any month name works and the year is the next one on or
  after the tenant's "today".
- Areas: the tenant's own service areas, longest name first, so "Miami Beach" isn't read as "Miami".
- Sources: fields found by the rules reader are marked `rules`, not `ai`.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import date
from typing import Protocol

KNOWN_COLORS = {"Repose Gray": "#CCC9C0", "Agreeable Gray": "#D1CBC1", "Extra White": "#F1F0EC", "Pure White": "#F2F0EA", "Naval": "#2F3B4C",
                "Sea Salt": "#CDD5CA", "Iron Ore": "#434341", "Alabaster": "#EDEAE0", "Tricorn Black": "#2F2F30", "Urbane Bronze": "#54504A",
                "Accessible Beige": "#D1C7B8", "Snowbound": "#EFEDE8", "Mindful Gray": "#BCB7AD", "Dover White": "#F0EADC",
                "Swiss Coffee": "#EEE9DF", "Chantilly Lace": "#F4F4F0", "Hale Navy": "#434C56", "Revere Pewter": "#CCC7B9"}
MARK = {"client": "client", "area": "area", "built": "lead", "hours": "hours", "deadline": "due", "earliest": "start", "value": "value",
        "hoa": "hoa", "lang": "lang", "important": "vip", "drywall": "drywall", "prep": "prep", "cutin": "cutin", "spray": "spray",
        "color": "color", "type": "type"}
MONTHS = {m: i + 1 for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
_MON_RE = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})"
SKILL_RES = {"drywall": r"plaster|drywall|skim|crack", "prep": r"pressure[- ]wash|patch|prep|degrease|sand\b|repair",
             "cutin": r"cut lines|cut-in|crisp", "spray": r"\bspray", "color": r"color and detail|color match|particular|designer|fine finish"}


def hash_color(name: str) -> str:
    h = 0
    for ch in name:
        h = (h * 31 + ord(ch)) % 360
    return f"hsl({h} 18% 72%)"


def _date(mon: str, day: str, today: date) -> str | None:
    m = MONTHS[mon[:3].lower()]
    d = int(day)
    for y in (today.year, today.year + 1):
        try:
            cand = date(y, m, d)
        except ValueError:
            return None
        if cand >= date(today.year, today.month, 1) or y > today.year:
            return cand.isoformat()
    return None


def rule_read(text: str, areas: list[str], today: date) -> dict:
    """Built-in reader: regular expressions over the estimate text (prototype ruleRead)."""
    t = text.replace("\r", "")
    ev: dict[str, str] = {}
    o: dict = {}

    def m(rx: str, k: str | None):
        r = re.search(rx, t, re.I)
        if r and k and k not in ev:
            ev[k] = r.group(0).strip()
        return r

    r = m(r"(?:Client|Customer)\s*:\s*([^\n,|]+)", "client")
    if r:
        o["client"] = r.group(1).strip()
    else:
        r2 = re.search(r"([A-Z][a-z]+)\s+[Rr]esidence", t)
        o["client"] = r2.group(1) if r2 else None
    o["area"] = next((a for a in sorted(areas, key=len, reverse=True) if re.search(re.escape(a), t, re.I)), None)
    if o["area"]:
        m(re.escape(o["area"]), "area")
    cab = bool(re.search(r"cabinet", t, re.I)) and not re.search(r"cabinets?\s+not\s+included", t, re.I)
    te = re.search(r"cabinet|wallpaper|HOA common|condo|office|commercial|venetian|faux|decorative|exterior|stucco|fascia|soffit|siding|interior", t, re.I)
    o["typeEv"] = te.group(0) if te else None
    if o["typeEv"]:
        m(re.escape(o["typeEv"]), "type")
    o["type"] = ("cabinets" if cab else "wallpaper" if re.search(r"wallpaper", t, re.I)
                 else "commercial" if re.search(r"\b(HOA common|condo|office|commercial)\b", t, re.I)
                 else "decorative" if re.search(r"venetian|faux|decorative", t, re.I)
                 else "exterior" if re.search(r"exterior|stucco|fascia|soffit|siding", t, re.I) else "interior")
    r = m(r"(?:built|year built)\s*:?\s*(?:in\s*)?(\d{4})", "built")
    o["built"] = int(r.group(1)) if r else None
    r = m(r"(\d{2,4})\s*(?:labor\s*)?(?:hrs|hours)\b", "hours") or m(r"(?:labor|hours)\s*:?\s*(\d{2,4})", "hours")
    o["hours"] = int(r.group(1)) if r else None
    r = m(r"(?:total|price)\s*:?\s*\$\s?([\d,]+)", "value")
    o["value"] = int(r.group(1).replace(",", "")) if r else None
    r = m(r"(?:by|before)\s+" + _MON_RE, "deadline")
    o["deadline"] = _date(r.group(1), r.group(2), today) if r else None
    r = m(r"(?:earliest start|start any time after|start after|starting)\s*:?\s*" + _MON_RE, "earliest")
    o["earliest"] = _date(r.group(1), r.group(2), today) if r else None
    o["skills"] = [k for k, rx in SKILL_RES.items() if m(rx, k)]
    o["lang"] = "ht" if re.search(r"creole|kreyòl", t, re.I) else "es" if re.search(r"spanish", t, re.I) else "en" if re.search(r"english", t, re.I) else None
    if o["lang"] != "en":
        m(r"spanish|creole", "lang")
    o["hoa"] = bool(m(r"\bHOA\b", "hoa"))
    r = m(r"\brefer\w*[^.\n]*|\bVIP\b[^.\n]*|returning client[^.\n]*|repeat client[^.\n]*", "important")
    o["important"] = r.group(0).strip() if r else None
    o["colors"] = [{"name": n} for n in KNOWN_COLORS if re.search(re.escape(n), t, re.I)]
    ln = [x for x in re.split(r"[ &]", o["client"] or "New") if x][-1]
    o["title"] = f"{ln} {'cabinets' if o['type'] == 'cabinets' else o['type']}"
    o["evidence"] = ev
    return o


def mark_text(text: str, ev: dict) -> str:
    """Write-up with each found quote marked as [kind|quote] (prototype markText)."""
    t = text.replace("[", "(").replace("]", ")")[:3000]
    spans = []
    for k, q in (ev or {}).items():
        kk = MARK.get(k, k)
        q = str(q or "").replace("[", "(").replace("]", ")")
        if kk and q:
            i = t.find(q)
            if i >= 0:
                spans.append((kk, q, i))
    spans.sort(key=lambda x: x[2])
    out, pos = "", 0
    for kk, q, i in spans:
        if i < pos:
            continue
        out += t[pos:i] + f"[{kk}|{q}]"
        pos = i + len(q)
    return out + t[pos:]


@dataclass
class ClientHistory:
    client_id: str
    language: str | None
    history: str | None        # e.g. "2021 interior repaint"; None = no past jobs


@dataclass
class Draft:
    title: str
    client: str
    area: str | None
    type: str
    built: int | None
    hours: float | None
    value: float | None
    earliest: str | None
    deadline: str | None
    colors: list[dict]
    skills: list[str]
    lang: str | None
    hoa: bool
    important: bool
    important_reason: str
    labels: list[str]
    evidence: dict
    sources: dict
    reader: str                # ai | rules
    client_id: str | None = None
    extra: dict = field(default_factory=dict)


def to_draft(ai: dict | None, text: str, reader: str, *, areas: list[str], job_types: list[str], skills: list[str], today: date,
             paintscout: dict | None = None, typed: dict | None = None, history: ClientHistory | None = None) -> Draft:
    """Merge: PaintScout field > typed by a person > AI > rules (BL-56). Dates are never guessed (BL-57)."""
    rr = rule_read(text or "", areas, today)

    def pick(k):
        if ai and ai.get(k) not in (None, ""):
            return ai[k]
        return rr.get(k)

    ev = {**(rr.get("evidence") or {}), **((ai or {}).get("evidence") or {})}
    typ = pick("type")
    lang = pick("lang")
    d = Draft(title=pick("title") or "New job", client=pick("client") or "", area=pick("area") or None,
              type=typ if typ in job_types else "interior", built=pick("built"), hours=pick("hours"), value=pick("value"),
              earliest=pick("earliest"), deadline=pick("deadline"),
              colors=[{"name": (c.get("name") if isinstance(c, dict) else str(c)),
                       "hex": KNOWN_COLORS.get(c.get("name") if isinstance(c, dict) else str(c)) or hash_color(c.get("name") if isinstance(c, dict) else str(c))}
                      for c in (pick("colors") or [])][:4],
              skills=[k for k in (pick("skills") or []) if k in skills], lang=lang if lang in ("en", "es", "ht") else None,
              hoa=bool(pick("hoa")), important=bool(pick("important")), important_reason=pick("important") or "", labels=[],
              evidence=ev, sources={}, reader=reader)
    found = "ai" if reader == "ai" else "rules"
    for k in ("client", "area", "built", "hours", "value", "earliest", "deadline"):
        v = getattr(d, k)
        d.sources[k] = (found if k in ev else "guessed") if v not in (None, "") else "missing"
    d.sources["type"] = found if "type" in ev else "missing"
    d.sources["lang"] = found if d.lang else "missing"
    for k, v in (paintscout or {}).items():
        if hasattr(d, k) and k not in ("sources", "evidence"):
            setattr(d, k, v)
            d.sources[k] = "paintscout"
    for k, v in (typed or {}).items():
        if k == "by":
            continue
        setattr(d, k, v)
        d.sources[k] = "typed"
    if history:  # clientHistoryFill: language and the important flag only
        d.client_id = history.client_id
        if history.history:
            if not d.lang and history.language:
                d.lang = history.language
                d.sources["lang"] = "client_history"
            if not d.important:
                d.important = True
                d.important_reason = f"Returning client ({history.history})"
    if d.hoa:
        d.labels.append("HOA")
    return d


# ---------- AI reader (DD-23) ----------

class DocumentReader(Protocol):
    name: str

    async def read(self, prompt: str, text: str | None, image: tuple[bytes, str] | None) -> dict: ...


def ai_prompt(text: str | None, *, image: bool, today: date, job_types: list[str], skills: list[tuple[str, str]]) -> str:
    """The prototype's aiRead prompt, with today's date from the tenant instead of a fixed day."""
    ex = ('{"title":"Morales exterior","client":"Luis & Carmen Morales","area":"South Miami","type":"exterior","built":1968,"hours":96,'
          '"value":11350,"earliest":"2026-11-02","deadline":"2026-11-20","colors":[{"name":"Agreeable Gray"}],"skills":["prep","spray"],'
          '"lang":"es","hoa":false,"important":null,"evidence":{"client":"quote","built":"quote","hours":"quote","deadline":"quote","prep":"quote"}'
          + (',"sourceText":"full text you read"' if image else "") + "}")
    body = "The estimate is in the attached image." if image else 'ESTIMATE:\n"""\n' + (text or "")[:12000] + '\n"""'
    return (f"You read painting contractor estimates for a crew scheduling tool. Today is {today:%A %b} {today.day}, {today.year}.\n"
            f"Reply with only one JSON object like this example:\n{ex}\n"
            f"Rules: type is one of {', '.join(job_types)}. skills uses only {', '.join(f'{k} ({l})' for k, l in skills)}. "
            "lang is en, es or ht (Haitian Creole). hours = labor hours. value = total sold price. "
            f"Dates YYYY-MM-DD, null if not stated. important = short reason if repeat, referral source, VIP or designer, else null. "
            "evidence: exact 2 to 12 word quotes from the estimate for each field you found.\n" + body)


class ClaudeReader:
    """Reads estimates with Claude through the Anthropic Messages API. Used only when an API key is configured."""
    name = "claude"

    def __init__(self, api_key: str, model: str):
        self.api_key, self.model = api_key, model

    async def read(self, prompt: str, text: str | None, image: tuple[bytes, str] | None) -> dict:
        import base64

        import httpx
        content: list[dict] = []
        if image:
            content.append({"type": "image", "source": {"type": "base64", "media_type": image[1], "data": base64.b64encode(image[0]).decode()}})
        content.append({"type": "text", "text": prompt})
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post("https://api.anthropic.com/v1/messages",
                             headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                             json={"model": self.model, "max_tokens": 1500, "messages": [{"role": "user", "content": content}]})
            r.raise_for_status()
            out = "".join(b.get("text", "") for b in r.json().get("content", []))
        return parse_json_object(out)


def parse_json_object(s: str) -> dict:
    a, b = s.find("{"), s.rfind("}")
    if a < 0 or b < a:
        raise ValueError("no JSON object in reply")
    return json.loads(s[a:b + 1])
