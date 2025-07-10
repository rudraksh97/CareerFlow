"""Add priority field to applications

Revision ID: abc123456789
Revises: def123456789
Create Date: 2024-01-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123456789'
down_revision: Union[str, Sequence[str], None] = 'def123456789'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add priority field to applications table."""
    # Create the enum type first
    application_priority_enum = sa.Enum('LOW', 'MEDIUM', 'HIGH', name='applicationpriority')
    application_priority_enum.create(op.get_bind())
    
    # Add the priority column with default value of 'MEDIUM'
    op.add_column('applications', sa.Column('priority', application_priority_enum, nullable=False, server_default='MEDIUM'))
    
    # Create index for priority
    op.create_index(op.f('ix_applications_priority'), 'applications', ['priority'], unique=False)
    
    # Create composite index for priority and status
    op.create_index('idx_priority_status', 'applications', ['priority', 'status'], unique=False)


def downgrade() -> None:
    """Remove priority field from applications table."""
    # Drop indexes first
    op.drop_index('idx_priority_status', table_name='applications')
    op.drop_index(op.f('ix_applications_priority'), table_name='applications')
    
    # Drop the column
    op.drop_column('applications', 'priority')
    
    # Drop the enum type
    sa.Enum(name='applicationpriority').drop(op.get_bind()) 