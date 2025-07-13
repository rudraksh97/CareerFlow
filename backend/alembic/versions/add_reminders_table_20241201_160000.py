"""Add reminders table

Revision ID: add_reminders_table_20241201_160000
Revises: add_email_calendar_tables_20241201_140000
Create Date: 2024-12-01 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_reminders_table_20241201_160000'
down_revision = 'jkl123456789'
branch_labels = None
depends_on = None


def upgrade():
    # Create reminders table
    op.create_table('reminders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reminder_time', sa.String(), nullable=False),
        sa.Column('reminder_date', sa.DateTime(), nullable=False),
        sa.Column('type', sa.Enum('DAILY', 'WEEKLY', 'MONTHLY', 'ONE_TIME', name='remindertype'), nullable=True),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', name='reminderpriority'), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('recurrence_pattern', sa.String(), nullable=True),
        sa.Column('next_reminder_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_reminders_id'), 'reminders', ['id'], unique=False)
    op.create_index(op.f('ix_reminders_reminder_date'), 'reminders', ['reminder_date'], unique=False)
    op.create_index(op.f('ix_reminders_type'), 'reminders', ['type'], unique=False)
    op.create_index(op.f('ix_reminders_priority'), 'reminders', ['priority'], unique=False)
    op.create_index(op.f('ix_reminders_completed'), 'reminders', ['completed'], unique=False)
    op.create_index(op.f('ix_reminders_is_active'), 'reminders', ['is_active'], unique=False)
    op.create_index(op.f('ix_reminders_next_reminder_date'), 'reminders', ['next_reminder_date'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_reminders_next_reminder_date'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_is_active'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_completed'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_priority'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_type'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_reminder_date'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_id'), table_name='reminders')
    
    # Drop table
    op.drop_table('reminders')
    
    # Drop custom enum types
    op.execute('DROP TYPE IF EXISTS remindertype')
    op.execute('DROP TYPE IF EXISTS reminderpriority') 