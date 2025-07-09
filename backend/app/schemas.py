from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from .models.application import ApplicationStatus, ApplicationSource
from .models.contact import ContactType

# Application Schemas
class ApplicationBase(BaseModel):
    company_name: str
    job_title: str
    job_id: str
    job_url: HttpUrl
    portal_url: Optional[HttpUrl] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    date_applied: datetime
    email_used: str
    resume_filename: str
    resume_file_path: str
    source: ApplicationSource
    notes: Optional[str] = None
    max_applications: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_id: Optional[str] = None
    job_url: Optional[HttpUrl] = None
    portal_url: Optional[HttpUrl] = None
    status: Optional[ApplicationStatus] = None
    date_applied: Optional[datetime] = None
    email_used: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_file_path: Optional[str] = None
    source: Optional[ApplicationSource] = None
    notes: Optional[str] = None
    max_applications: Optional[str] = None

class Application(ApplicationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Contact Schemas
class ContactBase(BaseModel):
    name: str
    email: str
    company: str
    role: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    contact_type: ContactType
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    contact_type: Optional[ContactType] = None
    notes: Optional[str] = None

class Contact(ContactBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Interaction Schemas
class InteractionBase(BaseModel):
    interaction_type: str
    notes: Optional[str] = None
    date: datetime

class InteractionCreate(InteractionBase):
    contact_id: str

class Interaction(InteractionBase):
    id: str
    contact_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Search and Filter Schemas
class ApplicationFilter(BaseModel):
    company_name: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    source: Optional[ApplicationSource] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    email_used: Optional[str] = None

class ContactFilter(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    contact_type: Optional[ContactType] = None
    email: Optional[str] = None

# Analytics Schemas
class ApplicationAnalytics(BaseModel):
    total_applications: int
    applications_by_status: dict
    applications_by_source: dict
    applications_by_month: dict
    success_rate: float

class ContactAnalytics(BaseModel):
    total_contacts: int
    contacts_by_type: dict
    contacts_by_company: dict
    recent_interactions: List[Interaction]

# Autofill Schemas
class CompanyInfo(BaseModel):
    portal_url: Optional[str] = None
    source: Optional[ApplicationSource] = None 