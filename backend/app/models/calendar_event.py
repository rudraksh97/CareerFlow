from sqlalchemy import Column, String, DateTime, Text, Enum, Boolean, Index
from sqlalchemy.sql import func
from .database import Base
import enum

class EventStatus(enum.Enum):
    CONFIRMED = "confirmed"
    TENTATIVE = "tentative"
    CANCELLED = "cancelled"

class EventType(enum.Enum):
    INTERVIEW = "interview"
    MEETING = "meeting"
    CALL = "call"
    DEADLINE = "deadline"
    NETWORKING = "networking"
    CONFERENCE = "conference"
    OTHER = "other"

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, index=True)  # Google Calendar event ID
    calendar_id = Column(String, nullable=False, index=True)  # Google Calendar ID
    summary = Column(String, nullable=False, index=True)  # Event title
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=False, index=True)
    timezone = Column(String, nullable=True)
    is_all_day = Column(Boolean, default=False)
    status = Column(Enum(EventStatus), default=EventStatus.CONFIRMED, index=True)
    event_type = Column(Enum(EventType), nullable=True, index=True)
    is_hiring_related = Column(Boolean, default=False, index=True)
    confidence_score = Column(String, nullable=True)  # AI confidence score (0-1)
    organizer_email = Column(String, nullable=True, index=True)
    organizer_name = Column(String, nullable=True)
    attendees = Column(Text, nullable=True)  # JSON array of attendee info
    meeting_link = Column(String, nullable=True)  # Zoom, Meet, etc.
    company_name = Column(String, nullable=True, index=True)  # Extracted company name
    job_title = Column(String, nullable=True, index=True)  # Extracted job title
    application_id = Column(String, nullable=True, index=True)  # Link to application
    interview_round = Column(String, nullable=True)  # e.g., "Technical", "Final", etc.
    notes = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    is_synced = Column(Boolean, default=True, index=True)
    last_sync_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_start_status', 'start_datetime', 'status'),
        Index('idx_hiring_type', 'is_hiring_related', 'event_type'),
        Index('idx_organizer_date', 'organizer_email', 'start_datetime'),
        Index('idx_company_type', 'company_name', 'event_type'),
        Index('idx_sync_status', 'is_synced', 'status'),
        Index('idx_upcoming_events', 'start_datetime', 'status', 'is_hiring_related'),
    )

    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, summary={self.summary[:50]}..., start={self.start_datetime})>" 