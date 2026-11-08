from __future__ import annotations

import uuid

from geoalchemy2 import Geography
from sqlalchemy import Index, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TenantScoped, tfk


class Region(TenantScoped, Base):
    """County or state, e.g. 'Miami-Dade, FL' (BL-15)."""
    __tablename__ = "region"
    __extra_args__ = (UniqueConstraint("tenant_id", "name"),)
    name: Mapped[str] = mapped_column(Text)


class ServiceArea(TenantScoped, Base):
    """A named area with a point; crews' home bases and job sites refer to these (BL-09)."""
    __tablename__ = "service_area"
    __extra_args__ = (UniqueConstraint("tenant_id", "name"), tfk(["region_id"], "ops.region"),
                      Index("ix_service_area_location", "location", postgresql_using="gist"))
    name: Mapped[str] = mapped_column(Text)
    region_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    location = mapped_column(Geography("POINT", srid=4326, spatial_index=False), nullable=False)
