"""crew members: lead-safe certification separate from crew lead (CRW-07)

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-09 20:40:00
"""
from alembic import op
import sqlalchemy as sa

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('crew_member', sa.Column('lead_safe', sa.Boolean(), server_default=sa.text('false'), nullable=False), schema='ops')


def downgrade() -> None:
    op.drop_column('crew_member', 'lead_safe', schema='ops')
