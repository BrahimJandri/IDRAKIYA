"""add_phone_to_users

Revision ID: a1b2c3d4e5f6
Revises: bc471d4214d7
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'bc471d4214d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone', sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'phone')
