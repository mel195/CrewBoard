"""Shared weather cache (no tenant). BL-05, CAL-04."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, SmallInteger, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class WeatherDay(Base):
    __tablename__ = "weather_day"
    __table_args__ = (UniqueConstraint("cell", "day", "source"), {"schema": "shared"})
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cell: Mapped[str] = mapped_column(Text)            # geohash-5 cell, or 'demo' for demo tenants
    day: Mapped[date] = mapped_column(Date)
    rain_probability: Mapped[int] = mapped_column(SmallInteger)
    condition: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(Text, default="sample")
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
