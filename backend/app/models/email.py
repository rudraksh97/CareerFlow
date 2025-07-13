from sqlalchemy import Column, String, DateTime, Text, Enum, Boolean, Index
from sqlalchemy.sql import func
from .database import Base
import enum

class EmailStatus(enum.Enum):
    UNREAD = "unread"
    READ = "read"
    DISCARDED = "discarded"
    ARCHIVED = "archived"

class EmailPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class EmailCategory(enum.Enum):
    JOB_APPLICATION = "job_application"
    INTERVIEW_INVITATION = "interview_invitation"
    REJECTION = "rejection"
    OFFER = "offer"
    RECRUITER_OUTREACH = "recruiter_outreach"
    FOLLOW_UP = "follow_up"
    OTHER = "other"

class Email(Base):
    __tablename__ = "emails"

    id = Column(String, primary_key=True, index=True)  # Gmail message ID
    thread_id = Column(String, index=True)  # Gmail thread ID
    subject = Column(String, nullable=False, index=True)
    sender_name = Column(String, nullable=True)
    sender_email = Column(String, nullable=False, index=True)
    recipient_email = Column(String, nullable=False, index=True)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    date_received = Column(DateTime, nullable=False, index=True)
    status = Column(Enum(EmailStatus), default=EmailStatus.UNREAD, index=True)
    priority = Column(Enum(EmailPriority), default=EmailPriority.MEDIUM, index=True)
    category = Column(Enum(EmailCategory), nullable=True, index=True)
    is_hiring_related = Column(Boolean, default=False, index=True)
    confidence_score = Column(String, nullable=True)  # AI confidence score (0-1)
    labels = Column(Text, nullable=True)  # JSON array of Gmail labels
    attachments = Column(Text, nullable=True)  # JSON array of attachment info
    company_name = Column(String, nullable=True, index=True)  # Extracted company name
    job_title = Column(String, nullable=True, index=True)  # Extracted job title
    application_id = Column(String, nullable=True, index=True)  # Link to application
    notes = Column(Text, nullable=True)
    is_synced = Column(Boolean, default=True, index=True)
    last_sync_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_status_category', 'status', 'category'),
        Index('idx_hiring_priority', 'is_hiring_related', 'priority'),
        Index('idx_sender_date', 'sender_email', 'date_received'),
        Index('idx_company_category', 'company_name', 'category'),
        Index('idx_sync_status', 'is_synced', 'status'),
    )

    def __repr__(self):
        return f"<Email(id={self.id}, subject={self.subject[:50]}..., sender={self.sender_email})>" 