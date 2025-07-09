from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class ContactType(enum.Enum):
    REFERRAL = "referral"
    RECRUITER = "recruiter"
    HIRING_MANAGER = "hiring_manager"
    OTHER = "other"

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, index=True)
    role = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)  # New field for LinkedIn URL
    contact_type = Column(Enum(ContactType), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship with interactions
    interactions = relationship("Interaction", back_populates="contact", cascade="all, delete-orphan")

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_company_type', 'company', 'contact_type'),
        Index('idx_name_company', 'name', 'company'),
    )

    def __repr__(self):
        return f"<Contact(id={self.id}, name={self.name}, company={self.company})>"

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String, primary_key=True, index=True)
    contact_id = Column(String, ForeignKey("contacts.id"), nullable=False, index=True)
    interaction_type = Column(String, nullable=False, index=True)  # email, call, meeting, etc.
    notes = Column(Text, nullable=True)
    date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())

    # Relationship with contact
    contact = relationship("Contact", back_populates="interactions")

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_contact_date', 'contact_id', 'date'),
        Index('idx_type_date', 'interaction_type', 'date'),
    )

    def __repr__(self):
        return f"<Interaction(id={self.id}, contact_id={self.contact_id}, type={self.interaction_type})>" 