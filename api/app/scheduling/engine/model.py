"""Plain data the scheduling engine works on.

The engine works in day indexes (0 = first day of the planning calendar), exactly like the
prototype. Services convert between real dates and indexes with `Snapshot.days`.
Nothing here touches the database.
"""
from __future__ import annotations

import copy
import math
from dataclasses import dataclass, field
from typing import Any


def js_round(x: float) -> int:
    """JavaScript Math.round: halves round toward +infinity."""
    return math.floor(x + 0.5)


@dataclass
class Day:
    iso: str
    dow: str  # Mon..Sun
    m: str    # month short name
    n: int    # day of month


@dataclass
class Hours:
    """Working hours by day kind; each is (start, end) as 'HH:MM' or None for off."""
    wk: tuple[str, str] | None = ("08:00", "17:00")
    sat: tuple[str, str] | None = None
    sun: tuple[str, str] | None = None


@dataclass
class Crew:
    id: str
    name: str
    status: str | None = "active"            # active | inactive | None (not set)
    size: tuple[int, int] | None = None      # (min, max) painters
    base: str | None = None                  # service area name (home base)
    region: str | None = None
    languages: str = ""                      # free text, e.g. "English, Spanish"
    lead_safe: bool | None = None
    hours: Hours | None = None               # None = tenant default
    ratings: dict[str, int | None] = field(default_factory=dict)
    review_counts: dict[str, int] = field(default_factory=dict)
    rating_sources: dict[str, str] = field(default_factory=dict)  # 'admin' bypasses review minimum

    @property
    def plan_size(self) -> int | None:
        return self.size[0] if self.size else None


@dataclass
class Job:
    id: str
    title: str
    area: str
    type: str                                 # job-type rating dimension key
    hours: float
    earliest: int                             # day index
    deadline: int                             # day index (finish by)
    value: float = 0
    region: str | None = None
    ext: bool = False                         # exterior (painting trade: rain holds)
    built: int | None = None                  # year built (painting trade: lead-safe)
    lang: str = "en"
    skills: list[str] = field(default_factory=list)
    signals: dict[str, Any] = field(default_factory=dict)  # returning, referrals, crm, trade, manual


@dataclass
class FixedBooking:
    """A confirmed job on the calendar that isn't in the queue (prototype BOOKS)."""
    id: str
    crew: str
    name: str
    what: str
    s: int
    e: int
    value: float = 0
    half: str | None = None


@dataclass
class Placement:
    crew: str
    segs: list[list[int]]
    status: str = "draft"                     # draft | scheduled
    extra: list[str] = field(default_factory=list)
    half: str | None = None
    holds: list[int] = field(default_factory=list)
    by: str | None = None                     # 'Optimizer recommended' etc.
    by_crew: str | None = None


@dataclass
class Booking:
    """One crew's occupation of a day range (computed)."""
    id: str
    crew: str
    s: int
    e: int
    name: str = ""
    what: str = ""
    value: float = 0
    half: str | None = None
    fixed: bool = False
    moved: int = 0
    jid: str | None = None
    seg: int = 0
    prop: bool = False                        # proposed (draft) placement
    extra_crew: bool = False


@dataclass
class Rules:
    min_type: int = 3
    lead: bool = True
    imp: bool = True
    imp_bar: int = 4
    weather: bool = True
    max_drive: int = 45
    untested: bool = False
    region: bool = True
    min_reviews: int = 1


@dataclass
class Dimension:
    k: str
    label: str
    group: str  # job | skill | attr


@dataclass
class Habit:
    """A Riley habit. `condition` is structured (job_type, min_value, skills_any) instead of JS code."""
    id: str
    text: str
    status: str                               # new | kept | ignored
    crew: str | None = None                   # prefer this crew
    avoid: str | None = None                  # avoid this crew
    n: int = 1
    condition: dict[str, Any] | None = None   # None = never matches


@dataclass
class OptimizerFeedback:
    reject: dict[str, list[str]] = field(default_factory=dict)   # job -> crews
    no_move: dict[str, bool] = field(default_factory=dict)       # booking id -> True
    block: list[dict[str, Any]] = field(default_factory=list)    # {jid|crew, s, e}


@dataclass
class Snapshot:
    """Everything the engine reads. Mutable only by plan_all / optimizer, which work on copies."""
    days: list[Day]
    crews: list[Crew]
    jobs: dict[str, Job]
    queue: list[str]
    fixed: list[FixedBooking]
    place: dict[str, Placement]
    shift: dict[str, int]
    reassign: dict[str, str]
    rules: Rules
    imp_on: dict[str, bool]
    imp_value: float
    hours_default: Hours
    labels: dict[str, dict[str, float]]        # label name -> weights
    job_label: dict[str, str]                   # job -> chosen label
    job_weights: dict[str, dict[str, float]]    # job -> custom weights
    dims: list[Dimension]
    rain_prob: list[int]                        # per day index, first 28 days
    geo: dict[str, tuple[float, float]]
    hist: dict[str, dict[str, float]]           # crew -> {sold, actual, pay, ...}
    avg_cost: float
    langs: dict[str, str]
    lead_tracked: bool
    lang_tracked: bool
    habits: list[Habit] = field(default_factory=list)
    lock: int = 5
    win: tuple[int, int] = (0, 13)
    opt_all: bool = False
    opt_margin: bool = False
    ofb: OptimizerFeedback = field(default_factory=OptimizerFeedback)
    slot_horizon: int = 27      # last start index searched (prototype: 27)
    span_horizon: int = 40      # last day a span may reach (prototype: 40)
    rain_days: int = 28         # days with weather data
    rain_threshold: int = 50    # rain probability that makes a hold
    _crew_index: dict[str, Crew] = field(default_factory=dict, repr=False)
    _oc: bool = False           # optimizer "all crews" pass in progress

    def crew(self, cid: str) -> Crew | None:
        if not self._crew_index or len(self._crew_index) != len(self.crews):
            self._crew_index = {c.id: c for c in self.crews}
        return self._crew_index.get(cid)

    def dims_of(self, group: str) -> list[Dimension]:
        return [d for d in self.dims if d.group == group]

    def dim_label(self, k: str) -> str:
        for d in self.dims:
            if d.k == k:
                return d.label
        return k

    def active_crews(self) -> list[Crew]:
        return [c for c in self.crews if c.status == "active"]

    def copy(self) -> "Snapshot":
        c = copy.deepcopy(self)
        c._crew_index = {}
        return c
