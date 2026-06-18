"""new users start as inactive (pending admin approval)

Revision ID: d7e8f9a0b1c2
Revises: a1b2c3d4e5f6
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = 'd7e8f9a0b1c2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Existing users stay active; new ones will default to False via the model
    op.execute(
        "ALTER TABLE users ALTER COLUMN is_active SET DEFAULT false"
    )


def downgrade():
    op.execute(
        "ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true"
    )
