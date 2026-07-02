"""sync schema with models — add missing columns and tables

Revision ID: 0004_sync_schema
Revises: 0003_add_retakeable_and_scoring
Create Date: 2026-07-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_sync_schema'
down_revision = '0003_add_retakeable_and_scoring'
branch_labels = None
depends_on = None


def upgrade():
    # --- user_rooms association table ---
    op.create_table(
        'user_rooms',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.id'), primary_key=True),
        sa.Column('status', sa.String(20), server_default='pending', nullable=True),
        sa.Column('can_create_quiz', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # --- rooms.code (unique 6-char join code) ---
    op.add_column('rooms', sa.Column('code', sa.String(10), nullable=True))
    op.create_index('ix_rooms_code', 'rooms', ['code'], unique=True)

    # --- questions.image_url ---
    op.add_column('questions', sa.Column('image_url', sa.String(512), nullable=True))

    # --- results.answers (JSON string) ---
    op.add_column('results', sa.Column('answers', sa.Text(), nullable=True))

    # --- quizzes.is_featured ---
    op.add_column('quizzes', sa.Column('is_featured', sa.Boolean(), server_default='false', nullable=False))


def downgrade():
    op.drop_column('quizzes', 'is_featured')
    op.drop_column('results', 'answers')
    op.drop_column('questions', 'image_url')
    op.drop_index('ix_rooms_code', table_name='rooms')
    op.drop_column('rooms', 'code')
    op.drop_table('user_rooms')
