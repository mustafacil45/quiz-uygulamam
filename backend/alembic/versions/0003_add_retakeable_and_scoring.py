"""add is_retakeable and scoring_mode to quizzes

Revision ID: 0003_add_retakeable_and_scoring
Revises: 0002_add_room_id
Create Date: 2026-06-15 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_add_retakeable_and_scoring'
down_revision = '0002_add_room_id'
branch_labels = None
depends_on = None


def upgrade():
    # add is_retakeable column to quizzes (default False)
    op.add_column('quizzes', sa.Column('is_retakeable', sa.Boolean(), server_default='false', nullable=False))
    # add scoring_mode column to quizzes (default 'first_score')
    op.add_column('quizzes', sa.Column('scoring_mode', sa.String(20), server_default='first_score', nullable=False))


def downgrade():
    op.drop_column('quizzes', 'scoring_mode')
    op.drop_column('quizzes', 'is_retakeable')
