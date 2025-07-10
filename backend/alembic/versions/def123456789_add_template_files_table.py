"""Add template_files table

Revision ID: def123456789
Revises: 123456789abc
Create Date: 2024-01-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'def123456789'
down_revision: Union[str, Sequence[str], None] = '123456789abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add template_files table and indexes."""
    # Create template_files table
    op.create_table('template_files',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('file_type', sa.Enum('RESUME', 'COVER_LETTER', name='templatefiletype'), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_template_files_id'), 'template_files', ['id'], unique=False)
    op.create_index(op.f('ix_template_files_file_type'), 'template_files', ['file_type'], unique=False)
    op.create_index(op.f('ix_template_files_created_at'), 'template_files', ['created_at'], unique=False)


def downgrade() -> None:
    """Remove template_files table and indexes."""
    # Drop indexes first
    op.drop_index(op.f('ix_template_files_created_at'), table_name='template_files')
    op.drop_index(op.f('ix_template_files_file_type'), table_name='template_files')
    op.drop_index(op.f('ix_template_files_id'), table_name='template_files')
    
    # Drop table
    op.drop_table('template_files')
    
    # Drop enum type
    sa.Enum(name='templatefiletype').drop(op.get_bind()) 