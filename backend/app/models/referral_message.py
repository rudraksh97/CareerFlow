from sqlalchemy import Column, String, Text, DateTime, Boolean, Enum, Index
from sqlalchemy.sql import func
from .database import Base
import enum

class ReferralMessageType(enum.Enum):
    """Types of referral messages"""
    COLD_OUTREACH = "cold_outreach"
    WARM_INTRODUCTION = "warm_introduction"
    FOLLOW_UP = "follow_up"
    THANK_YOU = "thank_you"
    NETWORKING = "networking"

class ReferralMessage(Base):
    __tablename__ = "referral_messages"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)  # Template name/title
    message_type = Column(Enum(ReferralMessageType), nullable=False, index=True)
    subject_template = Column(String, nullable=True)  # Email subject template
    message_template = Column(Text, nullable=False)  # Message body template
    target_company = Column(String, nullable=True, index=True)  # Specific company or null for general
    target_position = Column(String, nullable=True)  # Specific position or null for general
    
    # Template variables that can be used in the message
    # These will be replaced with actual values when generating the message
    # Common variables: {contact_name}, {company_name}, {position_title}, {your_name}, {your_background}
    
    is_active = Column(Boolean, default=True, index=True)  # Can be deactivated without deletion
    usage_count = Column(String, default="0")  # Track how many times this template was used
    
    # Metadata
    notes = Column(Text, nullable=True)  # Private notes about when/how to use this template
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_type_active', 'message_type', 'is_active'),
        Index('idx_company_position', 'target_company', 'target_position'),
        Index('idx_created_active', 'created_at', 'is_active'),
    )

    def __repr__(self):
        return f"<ReferralMessage(id={self.id}, title={self.title}, type={self.message_type.value})>" 