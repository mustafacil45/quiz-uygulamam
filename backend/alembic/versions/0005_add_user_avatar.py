"""add users.avatar_url for profile photos

Revision ID: 0005_add_user_avatar
Revises: 0004_sync_schema
Create Date: 2026-09-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_add_user_avatar'
down_revision = '0004_sync_schema'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('avatar_url', sa.String(512), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_url')
