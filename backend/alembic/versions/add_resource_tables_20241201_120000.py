"""Add resource and resource_groups tables

Revision ID: add_resource_tables
Revises: def123456789
Create Date: 2024-12-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ghi123456789'
down_revision: Union[str, Sequence[str], None] = 'abc123456789'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add resource_groups and resources tables with indexes."""
    
    # Create resource_groups table first (since resources references it)
    op.create_table('resource_groups',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for resource_groups
    op.create_index(op.f('ix_resource_groups_id'), 'resource_groups', ['id'], unique=False)
    op.create_index(op.f('ix_resource_groups_name'), 'resource_groups', ['name'], unique=False)
    op.create_index(op.f('ix_resource_groups_is_active'), 'resource_groups', ['is_active'], unique=False)
    op.create_index(op.f('ix_resource_groups_created_at'), 'resource_groups', ['created_at'], unique=False)
    
    # Create composite index
    op.create_index('idx_name_active', 'resource_groups', ['name', 'is_active'], unique=False)
    
    # Create resources table
    op.create_table('resources',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('group_id', sa.String(), nullable=True),
        sa.Column('tags', sa.String(), nullable=True),
        sa.Column('is_favorite', sa.Boolean(), nullable=True),
        sa.Column('visit_count', sa.String(), nullable=True),
        sa.Column('last_visited', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['group_id'], ['resource_groups.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for resources
    op.create_index(op.f('ix_resources_id'), 'resources', ['id'], unique=False)
    op.create_index(op.f('ix_resources_name'), 'resources', ['name'], unique=False)
    op.create_index(op.f('ix_resources_group_id'), 'resources', ['group_id'], unique=False)
    op.create_index(op.f('ix_resources_is_favorite'), 'resources', ['is_favorite'], unique=False)
    op.create_index(op.f('ix_resources_created_at'), 'resources', ['created_at'], unique=False)
    
    # Create composite indexes
    op.create_index('idx_group_favorite', 'resources', ['group_id', 'is_favorite'], unique=False)
    op.create_index('idx_name_group', 'resources', ['name', 'group_id'], unique=False)
    op.create_index('idx_favorite_created', 'resources', ['is_favorite', 'created_at'], unique=False)


def downgrade() -> None:
    """Remove resources and resource_groups tables."""
    
    # Drop resources table first (due to foreign key)
    # Drop composite indexes first
    op.drop_index('idx_favorite_created', table_name='resources')
    op.drop_index('idx_name_group', table_name='resources')
    op.drop_index('idx_group_favorite', table_name='resources')
    
    # Drop single column indexes
    op.drop_index(op.f('ix_resources_created_at'), table_name='resources')
    op.drop_index(op.f('ix_resources_is_favorite'), table_name='resources')
    op.drop_index(op.f('ix_resources_group_id'), table_name='resources')
    op.drop_index(op.f('ix_resources_name'), table_name='resources')
    op.drop_index(op.f('ix_resources_id'), table_name='resources')
    
    # Drop resources table
    op.drop_table('resources')
    
    # Drop resource_groups table
    # Drop composite index first
    op.drop_index('idx_name_active', table_name='resource_groups')
    
    # Drop single column indexes
    op.drop_index(op.f('ix_resource_groups_created_at'), table_name='resource_groups')
    op.drop_index(op.f('ix_resource_groups_is_active'), table_name='resource_groups')
    op.drop_index(op.f('ix_resource_groups_name'), table_name='resource_groups')
    op.drop_index(op.f('ix_resource_groups_id'), table_name='resource_groups')
    
    # Drop resource_groups table
    op.drop_table('resource_groups') 