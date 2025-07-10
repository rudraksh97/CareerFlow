"""Remove max_applications column

Revision ID: def456789012
Revises: 123456789abc
Create Date: 2025-01-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'def456789012'
down_revision: Union[str, Sequence[str], None] = '123456789abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove max_applications column from applications table."""
    # Drop the max_applications column
    op.drop_column('applications', 'max_applications')


def downgrade() -> None:
    """Add back max_applications column to applications table."""
    # Add back the max_applications column
    op.add_column('applications', sa.Column('max_applications', sa.String(), nullable=True)) 