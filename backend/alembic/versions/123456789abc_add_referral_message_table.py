"""Add referral_message table

Revision ID: 123456789abc
Revises: 041bd0560732
Create Date: 2024-01-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '123456789abc'
down_revision: Union[str, Sequence[str], None] = '041bd0560732'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add referral_message table and indexes."""
    # Create referral_messages table
    op.create_table('referral_messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message_type', sa.Enum('COLD_OUTREACH', 'WARM_INTRODUCTION', 'FOLLOW_UP', 'THANK_YOU', 'NETWORKING', name='referralmessagetype'), nullable=False),
        sa.Column('subject_template', sa.String(), nullable=True),
        sa.Column('message_template', sa.Text(), nullable=False),
        sa.Column('target_company', sa.String(), nullable=True),
        sa.Column('target_position', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('usage_count', sa.String(), nullable=True, default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_referral_messages_id'), 'referral_messages', ['id'], unique=False)
    op.create_index(op.f('ix_referral_messages_title'), 'referral_messages', ['title'], unique=False)
    op.create_index(op.f('ix_referral_messages_message_type'), 'referral_messages', ['message_type'], unique=False)
    op.create_index(op.f('ix_referral_messages_target_company'), 'referral_messages', ['target_company'], unique=False)
    op.create_index(op.f('ix_referral_messages_is_active'), 'referral_messages', ['is_active'], unique=False)
    op.create_index(op.f('ix_referral_messages_created_at'), 'referral_messages', ['created_at'], unique=False)
    
    # Create composite indexes
    op.create_index('idx_type_active', 'referral_messages', ['message_type', 'is_active'], unique=False)
    op.create_index('idx_company_position', 'referral_messages', ['target_company', 'target_position'], unique=False)
    op.create_index('idx_created_active', 'referral_messages', ['created_at', 'is_active'], unique=False)


def downgrade() -> None:
    """Remove referral_message table and indexes."""
    # Drop indexes first
    op.drop_index('idx_created_active', table_name='referral_messages')
    op.drop_index('idx_company_position', table_name='referral_messages')
    op.drop_index('idx_type_active', table_name='referral_messages')
    op.drop_index(op.f('ix_referral_messages_created_at'), table_name='referral_messages')
    op.drop_index(op.f('ix_referral_messages_is_active'), table_name='referral_messages')
    op.drop_index(op.f('ix_referral_messages_target_company'), table_name='referral_messages')
    op.drop_index(op.f('ix_referral_messages_message_type'), table_name='referral_messages')
    op.drop_index(op.f('ix_referral_messages_title'), table_name='referral_messages')
    op.drop_index(op.f('ix_referral_messages_id'), table_name='referral_messages')
    
    # Drop table
    op.drop_table('referral_messages')
    
    # Drop enum type
    sa.Enum(name='referralmessagetype').drop(op.get_bind()) 