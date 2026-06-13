"""add room_id to quizzes

Revision ID: 0002_add_room_id
Revises: 0001_initial
Create Date: 2025-12-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_room_id'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # add room_id column to quizzes
    op.add_column('quizzes', sa.Column('room_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_quizzes_room_id_rooms', 'quizzes', 'rooms', ['room_id'], ['id'], ondelete='CASCADE')


def downgrade():
    op.drop_constraint('fk_quizzes_room_id_rooms', 'quizzes', type_='foreignkey')
    op.drop_column('quizzes', 'room_id')
