"""Add email and calendar_events tables for integrations

Revision ID: add_email_calendar_tables
Revises: ghi123456789
Create Date: 2024-12-01 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'jkl123456789'
down_revision: Union[str, Sequence[str], None] = 'ghi123456789'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add emails and calendar_events tables with indexes."""
    
    # Create emails table
    op.create_table('emails',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('thread_id', sa.String(), nullable=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('sender_name', sa.String(), nullable=True),
        sa.Column('sender_email', sa.String(), nullable=False),
        sa.Column('recipient_email', sa.String(), nullable=False),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('date_received', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('UNREAD', 'READ', 'DISCARDED', 'ARCHIVED', name='emailstatus'), nullable=True),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', name='emailpriority'), nullable=True),
        sa.Column('category', sa.Enum('JOB_APPLICATION', 'INTERVIEW_INVITATION', 'REJECTION', 'OFFER', 'RECRUITER_OUTREACH', 'FOLLOW_UP', 'OTHER', name='emailcategory'), nullable=True),
        sa.Column('is_hiring_related', sa.Boolean(), nullable=True),
        sa.Column('confidence_score', sa.String(), nullable=True),
        sa.Column('labels', sa.Text(), nullable=True),
        sa.Column('attachments', sa.Text(), nullable=True),
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('job_title', sa.String(), nullable=True),
        sa.Column('application_id', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_synced', sa.Boolean(), nullable=True),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for emails
    op.create_index(op.f('ix_emails_id'), 'emails', ['id'], unique=False)
    op.create_index(op.f('ix_emails_thread_id'), 'emails', ['thread_id'], unique=False)
    op.create_index(op.f('ix_emails_subject'), 'emails', ['subject'], unique=False)
    op.create_index(op.f('ix_emails_sender_email'), 'emails', ['sender_email'], unique=False)
    op.create_index(op.f('ix_emails_recipient_email'), 'emails', ['recipient_email'], unique=False)
    op.create_index(op.f('ix_emails_date_received'), 'emails', ['date_received'], unique=False)
    op.create_index(op.f('ix_emails_status'), 'emails', ['status'], unique=False)
    op.create_index(op.f('ix_emails_priority'), 'emails', ['priority'], unique=False)
    op.create_index(op.f('ix_emails_category'), 'emails', ['category'], unique=False)
    op.create_index(op.f('ix_emails_is_hiring_related'), 'emails', ['is_hiring_related'], unique=False)
    op.create_index(op.f('ix_emails_company_name'), 'emails', ['company_name'], unique=False)
    op.create_index(op.f('ix_emails_job_title'), 'emails', ['job_title'], unique=False)
    op.create_index(op.f('ix_emails_application_id'), 'emails', ['application_id'], unique=False)
    op.create_index(op.f('ix_emails_is_synced'), 'emails', ['is_synced'], unique=False)
    op.create_index(op.f('ix_emails_created_at'), 'emails', ['created_at'], unique=False)
    
    # Create composite indexes for emails
    op.create_index('idx_status_category', 'emails', ['status', 'category'], unique=False)
    op.create_index('idx_hiring_priority', 'emails', ['is_hiring_related', 'priority'], unique=False)
    op.create_index('idx_sender_date', 'emails', ['sender_email', 'date_received'], unique=False)
    op.create_index('idx_company_category', 'emails', ['company_name', 'category'], unique=False)
    op.create_index('idx_sync_status', 'emails', ['is_synced', 'status'], unique=False)
    
    # Create calendar_events table
    op.create_table('calendar_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('calendar_id', sa.String(), nullable=False),
        sa.Column('summary', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('start_datetime', sa.DateTime(), nullable=False),
        sa.Column('end_datetime', sa.DateTime(), nullable=False),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('is_all_day', sa.Boolean(), nullable=True),
        sa.Column('status', sa.Enum('CONFIRMED', 'TENTATIVE', 'CANCELLED', name='eventstatus'), nullable=True),
        sa.Column('event_type', sa.Enum('INTERVIEW', 'MEETING', 'CALL', 'DEADLINE', 'NETWORKING', 'CONFERENCE', 'OTHER', name='eventtype'), nullable=True),
        sa.Column('is_hiring_related', sa.Boolean(), nullable=True),
        sa.Column('confidence_score', sa.String(), nullable=True),
        sa.Column('organizer_email', sa.String(), nullable=True),
        sa.Column('organizer_name', sa.String(), nullable=True),
        sa.Column('attendees', sa.Text(), nullable=True),
        sa.Column('meeting_link', sa.String(), nullable=True),
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('job_title', sa.String(), nullable=True),
        sa.Column('application_id', sa.String(), nullable=True),
        sa.Column('interview_round', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reminder_sent', sa.Boolean(), nullable=True),
        sa.Column('is_synced', sa.Boolean(), nullable=True),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for calendar_events
    op.create_index(op.f('ix_calendar_events_id'), 'calendar_events', ['id'], unique=False)
    op.create_index(op.f('ix_calendar_events_calendar_id'), 'calendar_events', ['calendar_id'], unique=False)
    op.create_index(op.f('ix_calendar_events_summary'), 'calendar_events', ['summary'], unique=False)
    op.create_index(op.f('ix_calendar_events_start_datetime'), 'calendar_events', ['start_datetime'], unique=False)
    op.create_index(op.f('ix_calendar_events_end_datetime'), 'calendar_events', ['end_datetime'], unique=False)
    op.create_index(op.f('ix_calendar_events_status'), 'calendar_events', ['status'], unique=False)
    op.create_index(op.f('ix_calendar_events_event_type'), 'calendar_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_calendar_events_is_hiring_related'), 'calendar_events', ['is_hiring_related'], unique=False)
    op.create_index(op.f('ix_calendar_events_organizer_email'), 'calendar_events', ['organizer_email'], unique=False)
    op.create_index(op.f('ix_calendar_events_company_name'), 'calendar_events', ['company_name'], unique=False)
    op.create_index(op.f('ix_calendar_events_job_title'), 'calendar_events', ['job_title'], unique=False)
    op.create_index(op.f('ix_calendar_events_application_id'), 'calendar_events', ['application_id'], unique=False)
    op.create_index(op.f('ix_calendar_events_is_synced'), 'calendar_events', ['is_synced'], unique=False)
    op.create_index(op.f('ix_calendar_events_created_at'), 'calendar_events', ['created_at'], unique=False)
    
    # Create composite indexes for calendar_events
    op.create_index('idx_start_status', 'calendar_events', ['start_datetime', 'status'], unique=False)
    op.create_index('idx_hiring_type', 'calendar_events', ['is_hiring_related', 'event_type'], unique=False)
    op.create_index('idx_organizer_date', 'calendar_events', ['organizer_email', 'start_datetime'], unique=False)
    op.create_index('idx_company_type', 'calendar_events', ['company_name', 'event_type'], unique=False)
    op.create_index('idx_sync_status_cal', 'calendar_events', ['is_synced', 'status'], unique=False)
    op.create_index('idx_upcoming_events', 'calendar_events', ['start_datetime', 'status', 'is_hiring_related'], unique=False)


def downgrade() -> None:
    """Remove emails and calendar_events tables."""
    
    # Drop calendar_events table
    # Drop composite indexes first
    op.drop_index('idx_upcoming_events', table_name='calendar_events')
    op.drop_index('idx_sync_status_cal', table_name='calendar_events')
    op.drop_index('idx_company_type', table_name='calendar_events')
    op.drop_index('idx_organizer_date', table_name='calendar_events')
    op.drop_index('idx_hiring_type', table_name='calendar_events')
    op.drop_index('idx_start_status', table_name='calendar_events')
    
    # Drop single column indexes
    op.drop_index(op.f('ix_calendar_events_created_at'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_is_synced'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_application_id'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_job_title'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_company_name'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_organizer_email'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_is_hiring_related'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_event_type'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_status'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_end_datetime'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_start_datetime'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_summary'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_calendar_id'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_id'), table_name='calendar_events')
    
    # Drop calendar_events table
    op.drop_table('calendar_events')
    
    # Drop emails table
    # Drop composite indexes first
    op.drop_index('idx_sync_status', table_name='emails')
    op.drop_index('idx_company_category', table_name='emails')
    op.drop_index('idx_sender_date', table_name='emails')
    op.drop_index('idx_hiring_priority', table_name='emails')
    op.drop_index('idx_status_category', table_name='emails')
    
    # Drop single column indexes
    op.drop_index(op.f('ix_emails_created_at'), table_name='emails')
    op.drop_index(op.f('ix_emails_is_synced'), table_name='emails')
    op.drop_index(op.f('ix_emails_application_id'), table_name='emails')
    op.drop_index(op.f('ix_emails_job_title'), table_name='emails')
    op.drop_index(op.f('ix_emails_company_name'), table_name='emails')
    op.drop_index(op.f('ix_emails_is_hiring_related'), table_name='emails')
    op.drop_index(op.f('ix_emails_category'), table_name='emails')
    op.drop_index(op.f('ix_emails_priority'), table_name='emails')
    op.drop_index(op.f('ix_emails_status'), table_name='emails')
    op.drop_index(op.f('ix_emails_date_received'), table_name='emails')
    op.drop_index(op.f('ix_emails_recipient_email'), table_name='emails')
    op.drop_index(op.f('ix_emails_sender_email'), table_name='emails')
    op.drop_index(op.f('ix_emails_subject'), table_name='emails')
    op.drop_index(op.f('ix_emails_thread_id'), table_name='emails')
    op.drop_index(op.f('ix_emails_id'), table_name='emails')
    
    # Drop emails table
    op.drop_table('emails') 