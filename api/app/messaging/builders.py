"""Message texts, ported from the prototype (buildMsgs, buildFixedMsgs, crewMsg, clientMsg, pmMsg, colorMsgs).

Phase 1 BL-52 to BL-54. Pure functions: given job, crews, dates and trigger settings, return messages with
every language variant, so the review screen can switch language without rebuilding (MSG-02).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.scheduling.engine.model import Day, js_round

DAYN = {
    "en": {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday", "Sun": "Sunday"},
    "es": {"Mon": "lunes", "Tue": "martes", "Wed": "miércoles", "Thu": "jueves", "Fri": "viernes", "Sat": "sábado", "Sun": "domingo"},
    "ht": {"Mon": "lendi", "Tue": "madi", "Wed": "mèkredi", "Thu": "jedi", "Fri": "vandredi", "Sat": "samdi", "Sun": "dimanch"},
    "pt": {"Mon": "segunda", "Tue": "terça", "Wed": "quarta", "Thu": "quinta", "Fri": "sexta", "Sat": "sábado", "Sun": "domingo"},
}
_M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONN = {
    "en": dict(zip(_M, ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"])),
    "es": dict(zip(_M, ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"])),
    "ht": dict(zip(_M, ["janvye", "fevriye", "mas", "avril", "me", "jen", "jiyè", "out", "septanm", "oktòb", "novanm", "desanm"])),
    "pt": dict(zip(_M, ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"])),
}
KIND = {
    "en": {"exterior": "exterior painting", "interior": "interior painting", "cabinets": "cabinet painting", "commercial": "painting", "wallpaper": "wallpaper", "decorative": "decorative painting"},
    "es": {"exterior": "pintura exterior", "interior": "pintura interior", "cabinets": "pintura de gabinetes", "commercial": "pintura", "wallpaper": "papel tapiz", "decorative": "pintura decorativa"},
    "ht": {"exterior": "penti eksteryè", "interior": "penti enteryè", "cabinets": "penti kabinè", "commercial": "penti", "wallpaper": "papye pent", "decorative": "penti dekoratif"},
}
CREW_L = {
    "en": {"n": "New job", "m": "Schedule change", "c": "Cancelled", "start": "start 8am", "addr": "address and photos in the app", "ext": "Exterior. Wash day 1, body coats on dry days only.", "hoa": "HOA hours 8 to 5.", "lead": "Lead-safe setup required.", "col": "Colors", "pay": "Job pay", "pdw": "painter days", "yes": "Reply YES to accept.", "off": "is off your schedule for now. We’ll send a new date.", "now": "now", "sec": "You’re sharing this job with another crew."},
    "es": {"n": "Nuevo trabajo", "m": "Cambio de horario", "c": "Cancelado", "start": "empieza 8am", "addr": "dirección y fotos en la app", "ext": "Exterior. Lavado el día 1, capas solo en días secos.", "hoa": "Horario HOA de 8 a 5.", "lead": "Requiere trabajo seguro con plomo.", "col": "Colores", "pay": "Pago", "pdw": "días-pintor", "yes": "Responda SÍ para aceptar.", "off": "sale de su calendario por ahora. Le enviaremos una nueva fecha.", "now": "ahora", "sec": "Comparte este trabajo con otro equipo."},
    "pt": {"n": "Novo trabalho", "m": "Mudança de agenda", "c": "Cancelado", "start": "começa 8h", "addr": "endereço e fotos no app", "ext": "Exterior. Lavar no dia 1, demãos só em dias secos.", "hoa": "Horário do HOA das 8 às 17.", "lead": "Exige trabalho seguro com chumbo.", "col": "Cores", "pay": "Pagamento", "pdw": "dias-pintor", "yes": "Responda SIM para aceitar.", "off": "saiu da sua agenda por enquanto. Enviaremos uma nova data.", "now": "agora", "sec": "Você divide este trabalho com outra equipe."},
    "ht": {"n": "Nouvo travay", "m": "Chanjman orè", "c": "Anile", "start": "kòmanse 8am", "addr": "adrès ak foto nan app la", "ext": "Eksteryè. Lave jou 1, kouch yo sèlman jou ki sèk.", "hoa": "Lè HOA 8 a 5.", "lead": "Fòk yo travay san danje ak plon.", "col": "Koulè", "pay": "Peman", "pdw": "jou-pent", "yes": "Reponn WI pou aksepte.", "off": "pa nan orè ou pou kounye a. N ap voye yon nouvo dat.", "now": "kounye a", "sec": "Ou pataje travay sa a ak yon lòt ekip."},
}
COLORLINE = {
    "en": "\n\nOne more thing: we still need your color and material picks before we start. Reply here or use the color form we sent.",
    "es": "\n\nUna cosa más: todavía necesitamos su selección de colores y materiales antes de comenzar. Responda aquí o use el formulario de colores que le enviamos.",
    "ht": "\n\nYon lòt bagay: nou toujou bezwen chwa koulè ak materyèl ou yo anvan nou kòmanse. Reponn isit la oswa itilize fòm koulè nou voye a.",
    "pt": "\n\nMais uma coisa: ainda precisamos da sua escolha de cores e materiais antes de começar. Responda aqui ou use o formulário de cores que enviamos.",
}
CCONF = {
    "en": lambda t, l: f"Colors confirmed for {t}: {l}. You’re good to go.",
    "es": lambda t, l: f"Colores confirmados para {t}: {l}. Todo listo.",
    "pt": lambda t, l: f"Cores confirmadas para {t}: {l}. Tudo certo.",
    "ht": lambda t, l: f"Koulè yo konfime pou {t}: {l}. Tout bagay pare.",
}
TRIGGERS = {"confirm": "Job confirmed", "move": "Job moved", "cancel": "Job unscheduled", "reminder": "Day-before reminder",
            "rain": "Rain delay", "colors": "Colors confirmed", "followup": "Client follow-up", "client": "Client message",
            "color_form": "Color form"}
DEFAULT_TRIGGERS = {  # prototype S.comm after v7
    "confirm": {"crew": True, "client": True, "hoa": True, "pm": True},
    "move": {"crew": True, "client": True, "hoa": False, "pm": True},
    "cancel": {"crew": True, "client": True, "hoa": False, "pm": True},
    "reminder": {"crew": True, "client": True, "hoa": False, "pm": False},
    "rain": {"crew": True, "client": True, "hoa": False, "pm": False},
    "colors": {"crew": True, "client": False, "hoa": False, "pm": True},
}
CREW_LANGS = ["en", "es", "pt", "ht"]
CLIENT_LANGS = ["en", "es", "ht"]


@dataclass
class MsgCrew:
    id: str
    name: str
    size: int | None
    lead_language: str | None
    channel: str | None
    phone: str | None
    cost_per_painter_day: float | None   # hist costSold, else company average is used


@dataclass
class MsgJob:
    title: str
    client: str
    area: str
    type_key: str
    type_label: str
    hours: float
    ext: bool
    hoa: bool
    built: int | None
    colors: list[str]
    colors_confirmed: bool
    lang: str


@dataclass
class MsgPm:
    name: str
    channel: str
    phone: str | None = None


@dataclass
class Msg:
    key: str
    role: str                     # crew | client | hoa | pm
    to: str
    channel: str
    lang: str
    langs: list[str]
    variants: dict[str, str] = field(default_factory=dict)
    crew_id: str | None = None

    @property
    def text(self) -> str:
        return self.variants[self.lang]


def money(v: float) -> str:
    return "$" + f"{js_round(v):,}"


def dtl(days: list[Day], i: int, lang: str) -> str:
    x = days[min(len(days) - 1, i)]
    if lang == "en":
        return f"{DAYN['en'][x.dow]}, {MONN['en'][x.m]} {x.n}"
    if lang == "es":
        return f"{DAYN['es'][x.dow]} {x.n} de {MONN['es'][x.m]}"
    if lang == "pt":
        return f"{DAYN['pt'][x.dow]}, {x.n} de {MONN['pt'][x.m]}"
    return f"{DAYN['ht'][x.dow]} {x.n} {MONN['ht'][x.m]}"


def _num(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else repr(float(x))


def crew_msg(days, lang, trig, title, s, e, area, ext, hoa, lead, colors, pay, pd, second) -> str:
    ds = dtl(days, s, lang) + (" – " + dtl(days, e, lang) if e != s else "")
    L = CREW_L.get(lang, {})
    if trig == "cancel":
        return f"{L['c']}: {title} ({ds}) {L['off']}"
    if trig == "move":
        return f"{L['m']}: {title}\n{L['now']} {ds}, {L['start']}\n{L['yes']}"
    t = (f"{L['n']}: {title}\n{ds}, {L['start']}\n{area}, {L['addr']}\n{L['ext'] if ext else ''}{' ' + L['hoa'] if hoa else ''}\n"
         f"{L['lead'] + chr(10) if lead else ''}{L['col']}: {colors}\n{L['pay']}: {money(pay)} ({_num(pd)} {L['pdw']})"
         f"{chr(10) + L['sec'] if second else ''}\n{L['yes']}")
    return t.replace("\n\n", "\n")


def client_msg(days, company, lang, trig, names, kind, s, e, crew_name, ext) -> str:
    k = (KIND.get(lang) or KIND["en"]).get(kind, kind)
    if lang == "es":
        n = names.replace("&", "y", 1)
        if trig == "move":
            return f"Hola {n}, le saluda {company}. Hemos reprogramado su proyecto de {k}: ahora comienza el {dtl(days, s, 'es')} y terminará el {dtl(days, e, 'es')}. Disculpe las molestias. Responda a este mensaje si tiene alguna pregunta."
        if trig == "cancel":
            return f"Hola {n}, le saluda {company}. Necesitamos ajustar la fecha de inicio de su proyecto de {k}. Nuestro equipo le contactará pronto con una nueva fecha. Gracias por su paciencia."
        return (f"Hola {n}, le saluda {company}. Su proyecto de {k} está programado para comenzar el {dtl(days, s, 'es')}, con fecha estimada de finalización el {dtl(days, e, 'es')}. "
                f"El equipo de {crew_name} llegará a las 8:00 a. m.{' Si el clima afecta el calendario, le avisaremos con anticipación.' if ext else ''} Responda a este mensaje si tiene alguna pregunta. Gracias por confiar en nosotros.")
    if lang == "ht":
        n = names.replace("&", "ak", 1)
        if trig == "move":
            return f"Bonjou {n}, se {company}. Nou chanje dat travay {k} ou a: kounye a li kòmanse {dtl(days, s, 'ht')} epi l ap fini {dtl(days, e, 'ht')}. Eskize nou pou deranjman an. Tanpri reponn mesaj sa a si w gen kesyon."
        if trig == "cancel":
            return f"Bonjou {n}, se {company}. Nou bezwen chanje dat kòmansman travay {k} ou a. Ekip nou an ap kontakte w byento ak yon nouvo dat. Mèsi pou pasyans ou."
        return (f"Bonjou {n}, se {company}. Travay {k} ou a pwograme pou kòmanse {dtl(days, s, 'ht')}, epi nou prevwa fini {dtl(days, e, 'ht')}. "
                f"Ekip {crew_name} ap rive a 8:00 AM.{' Si move tan chanje orè a, n ap kontakte w davans.' if ext else ''} Tanpri reponn mesaj sa a si w gen nenpòt kesyon. Mèsi paske w fè nou konfyans.")
    n = names.replace("&", "and", 1)
    if trig == "move":
        return f"Hello {n}, this is {company}. Your {k} project has been rescheduled to begin {dtl(days, s, 'en')}, with completion expected by {dtl(days, e, 'en')}. We apologize for any inconvenience. Please reply with any questions."
    if trig == "cancel":
        return f"Hello {n}, this is {company}. We need to adjust the start date for your {k} project. Our team will contact you shortly with a new date. Thank you for your patience."
    return (f"Hello {n}, this is {company}. Your {k} project is scheduled to begin {dtl(days, s, 'en')}, with completion expected by {dtl(days, e, 'en')}. "
            f"{crew_name}’s crew will arrive at 8:00 AM.{' If weather affects the schedule, we will let you know in advance.' if ext else ''} Please reply to this message with any questions. Thank you for choosing us.")


def _painter_days(hours: float) -> float:
    return js_round(hours / 8 * 10) / 10


def build_job_messages(*, days: list[Day], company: str, triggers: dict, avg_cost: float, job: MsgJob, crews: list[MsgCrew],
                       s: int, e: int, trigger: str, client_lang: str | None = None, pm: MsgPm | None = None) -> list[Msg]:
    """Messages for one job and trigger. `crews` = lead crew first, then extra crews (BL-52 to BL-54)."""
    T = triggers.get(trigger) or {}
    out: list[Msg] = []
    names = re.sub(r" \w+$", "", job.client, flags=re.ASCII)
    pdays = _painter_days(job.hours)
    combo = sum((c.size or 1) for c in crews)
    colors = ", ".join(job.colors)
    lead_flag = job.built is not None and job.built < 1978
    if T.get("crew"):
        for i, c in enumerate(crews):
            share = js_round(pdays * (c.size or 1) / combo * 10) / 10 if len(crews) > 1 else pdays
            pay = js_round(share * (c.cost_per_painter_day if c.cost_per_painter_day is not None else avg_cost) / 10) * 10
            m = Msg(key=f"crew:{c.id}", role="crew", to=f"{c.name} (crew lead)", channel=c.channel or "whatsapp",
                    lang=c.lead_language or "es", langs=CREW_LANGS, crew_id=c.id)
            m.variants = {l: crew_msg(days, l, trigger, job.title, s, e, job.area, job.ext, job.hoa, lead_flag, colors, pay, share,
                                      len(crews) > 1 and i > 0) for l in CREW_LANGS}
            out.append(m)
    if T.get("client"):
        m = Msg(key="client", role="client", to=job.client, channel="text", lang=client_lang or job.lang, langs=CLIENT_LANGS)
        add_color = not job.colors_confirmed and trigger in ("confirm", "move")
        m.variants = {l: client_msg(days, company, l, trigger, names, job.type_key, s, e, crews[0].name, job.ext)
                      + (COLORLINE.get(l, COLORLINE["en"]) if add_color else "") for l in CLIENT_LANGS}
        out.append(m)
    if T.get("hoa") and job.hoa:
        last = job.client.split(" ")[-1]
        m = Msg(key="hoa", role="hoa", to="HOA office", channel="email", lang="en", langs=["en"])
        m.variants = {"en": f"Work notice for the {last} residence: exterior painting {dtl(days, s, 'en')} to {dtl(days, e, 'en')}, "
                            f"weekdays 8am to 5pm. Approved colors on file. {company}."}
        out.append(m)
    if pm and T.get("pm"):
        m = Msg(key="pm", role="pm", to=f"{pm.name} (PM)", channel=pm.channel, lang="en", langs=["en"])
        m.variants = {"en": pm_msg(days, job, crews, s, e, trigger)}
        out.append(m)
    return out


def pm_msg(days, job: MsgJob, crews: list[MsgCrew], s: int, e: int, trig: str) -> str:
    ok = job.colors_confirmed
    crew_l = " + ".join(f"{c.name}{f' ({c.phone})' if c.phone else ''}" for c in crews)
    dates = f"{dtl(days, s, 'en')} to {dtl(days, e, 'en')}"
    if trig == "cancel":
        return f"Heads up: {job.title} is off the calendar for now. Crew: {crew_l}. Hold any paint order. We’ll send a new date."
    if trig == "move":
        return f"Schedule change: {job.title} now runs {dates}. Crew: {crew_l}. Client: {job.client}, {job.area}.{'' if ok else ' Colors are still outstanding.'}"
    return (f"New job for you: {job.title}\nClient: {job.client}, {job.area}{' (HOA, 8 to 5)' if job.hoa else ''}\nCrew: {crew_l}\nDates: {dates}\n"
            f"Work: {job.type_label.lower()}, {_num(_painter_days(job.hours))} painter days{', lead-safe setup required' if job.built is not None and job.built < 1978 else ''}\n"
            f"Colors: {', '.join(job.colors)}{' (confirmed)' if ok else ' (NOT confirmed yet, client has the color form)'}\n"
            f"Paint order: {'ready to order' if ok else 'hold until colors are confirmed'}")


def build_fixed_messages(*, days, company, triggers, crew: MsgCrew, name: str, what: str, s: int, e: int, trigger: str) -> list[Msg]:
    """Messages for a confirmed job outside the queue that the optimizer shifted (prototype buildFixedMsgs)."""
    T = triggers.get(trigger) or {}
    out = []
    if T.get("crew"):
        m = Msg(key="crew", role="crew", to=f"{crew.name} (crew lead)", channel=crew.channel or "whatsapp", lang=crew.lead_language or "es",
                langs=CREW_LANGS, crew_id=crew.id)
        m.variants = {l: crew_msg(days, l, trigger, name, s, e, "", False, False, False, "", 0, 0, False) for l in CREW_LANGS}
        out.append(m)
    if T.get("client"):
        m = Msg(key="client", role="client", to=f"{name} client", channel="text", lang="en", langs=CLIENT_LANGS)

        def fix(t: str) -> str:
            t = re.sub(r" ,", ",", t, count=1)
            return t.replace("Hello ,", "Hello,", 1).replace("Hola ,", "Hola,", 1).replace("Bonjou ,", "Bonjou,", 1)
        m.variants = {l: fix(client_msg(days, company, l, trigger, "", what.lower(), s, e, crew.name, what == "Exterior")) for l in CLIENT_LANGS}
        out.append(m)
    return out


def build_color_messages(*, days, triggers, job: MsgJob, crews: list[MsgCrew], s: int, pm: MsgPm | None) -> list[Msg]:
    """Colors confirmed: tell the crew leads and the PM (v7)."""
    T = triggers.get("colors") or {}
    lst = ", ".join(job.colors)
    out = []
    if T.get("crew"):
        for c in crews:
            m = Msg(key=f"crew:{c.id}", role="crew", to=f"{c.name} (crew lead)", channel=c.channel or "whatsapp", lang=c.lead_language or "es",
                    langs=CREW_LANGS, crew_id=c.id)
            m.variants = {l: CCONF.get(l, CCONF["en"])(job.title, lst) for l in CREW_LANGS}
            out.append(m)
    if T.get("pm") and pm:
        m = Msg(key="pm", role="pm", to=f"{pm.name} (PM)", channel=pm.channel, lang="en", langs=["en"])
        m.variants = {"en": f"Colors confirmed for {job.title} ({job.client}): {lst}. Paint order can go in. Crew: {crews[0].name}, starts {dtl(days, s, 'en')}."}
        out.append(m)
    return out
