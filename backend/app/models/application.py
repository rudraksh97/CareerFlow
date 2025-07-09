from sqlalchemy import Column, String, DateTime, Text, Enum, Index
from sqlalchemy.sql import func
from .database import Base
import enum

class ApplicationStatus(enum.Enum):
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    PENDING = "pending"

class ApplicationSource(enum.Enum):
    ANGELIST = "angelist"
    YC = "yc"
    COMPANY_WEBSITE = "company_website"
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"
    OTHER = "other"

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True)
    company_name = Column(String, nullable=False, index=True)
    job_title = Column(String, nullable=False)
    job_id = Column(String, nullable=False)
    job_url = Column(String, nullable=False)
    portal_url = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, index=True)
    date_applied = Column(DateTime, nullable=False, index=True)
    email_used = Column(String, nullable=False)
    resume_filename = Column(String, nullable=False)  # Store the filename
    resume_file_path = Column(String, nullable=False)  # Store the file path
    source = Column(Enum(ApplicationSource), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    max_applications = Column(String, nullable=True)  # For tracking limits
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_status_date', 'status', 'date_applied'),
        Index('idx_source_status', 'source', 'status'),
        Index('idx_company_status', 'company_name', 'status'),
    )

    def __repr__(self):
        return f"<Application(id={self.id}, company={self.company_name}, title={self.job_title})>" 