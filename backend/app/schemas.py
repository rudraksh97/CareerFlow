from pydantic import BaseModel, HttpUrl, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
from .models.application import ApplicationStatus, ApplicationSource, ApplicationPriority
from .models.contact import ContactType
from .models.referral_message import ReferralMessageType
from .models.template_file import TemplateFileType
from .models.email import EmailStatus, EmailPriority, EmailCategory
from .models.calendar_event import EventStatus, EventType
from .models.reminder import ReminderType, ReminderPriority

# Application Schemas
class ApplicationBase(BaseModel):
    company_name: str
    job_title: str
    job_id: str
    job_url: HttpUrl
    portal_url: Optional[HttpUrl] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    priority: ApplicationPriority = ApplicationPriority.MEDIUM
    date_applied: datetime
    email_used: str
    resume_filename: str
    resume_file_path: str
    cover_letter_filename: Optional[str] = None
    cover_letter_file_path: Optional[str] = None
    source: ApplicationSource
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_id: Optional[str] = None
    job_url: Optional[HttpUrl] = None
    portal_url: Optional[HttpUrl] = None
    status: Optional[ApplicationStatus] = None
    priority: Optional[ApplicationPriority] = None
    date_applied: Optional[datetime] = None
    email_used: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_file_path: Optional[str] = None
    cover_letter_filename: Optional[str] = None
    cover_letter_file_path: Optional[str] = None
    source: Optional[ApplicationSource] = None
    notes: Optional[str] = None

class Application(ApplicationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Contact Schemas
class ContactBase(BaseModel):
    name: str
    email: EmailStr
    company: str
    role: Optional[str] = None
    linkedin_url: Optional[str] = None
    contact_type: ContactType
    notes: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    company: str
    role: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    contact_type: ContactType
    notes: Optional[str] = None

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
    pass

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
    priority: Optional[ApplicationPriority] = None
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

# Settings Schemas
class SettingBase(BaseModel):
    key: str
    value: str
    
    @field_validator('key')
    @classmethod
    def validate_key(cls, v):
        if not v or not v.strip():
            raise ValueError("Key cannot be empty or whitespace-only")
        return v.strip()

class SettingCreate(SettingBase):
    pass

class Setting(SettingBase):
    class Config:
        from_attributes = True

# Profile Schemas
class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    headline: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: int

    class Config:
        from_attributes = True

# Referral Message Schemas
class ReferralMessageBase(BaseModel):
    title: str
    message_type: ReferralMessageType
    subject_template: Optional[str] = None
    message_template: str
    target_company: Optional[str] = None
    target_position: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None

class ReferralMessageCreate(ReferralMessageBase):
    pass

class ReferralMessageUpdate(BaseModel):
    title: Optional[str] = None
    message_type: Optional[ReferralMessageType] = None
    subject_template: Optional[str] = None
    message_template: Optional[str] = None
    target_company: Optional[str] = None
    target_position: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class ReferralMessage(ReferralMessageBase):
    id: str
    usage_count: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Referral Message Generation Schema
class GenerateReferralMessageRequest(BaseModel):
    template_id: str
    contact_name: Optional[str] = None
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    your_name: Optional[str] = None
    your_background: Optional[str] = None
    custom_variables: Optional[dict] = None

class GeneratedReferralMessage(BaseModel):
    subject: Optional[str] = None
    message: str
    template_title: str
    variables_used: dict

# Template File Schemas
class TemplateFileBase(BaseModel):
    name: str
    file_type: TemplateFileType
    filename: str
    file_path: str
    description: Optional[str] = None

class TemplateFileCreate(BaseModel):
    name: str
    file_type: TemplateFileType
    description: Optional[str] = None

class TemplateFileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TemplateFile(TemplateFileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Resource Group Schemas
class ResourceGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True

class ResourceGroupCreate(ResourceGroupBase):
    pass

class ResourceGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class ResourceGroup(ResourceGroupBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Resource Schemas
class ResourceBase(BaseModel):
    name: str
    url: HttpUrl
    description: Optional[str] = None
    group_id: Optional[str] = None
    tags: Optional[str] = None
    is_favorite: bool = False

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    description: Optional[str] = None
    group_id: Optional[str] = None
    tags: Optional[str] = None
    is_favorite: Optional[bool] = None

class Resource(ResourceBase):
    id: str
    visit_count: str
    last_visited: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    group: Optional[ResourceGroup] = None

    class Config:
        from_attributes = True

# Resource Analytics Schema
class ResourceAnalytics(BaseModel):
    total_resources: int
    total_groups: int
    favorites_count: int
    most_visited: List[Resource]
    recent_resources: List[Resource]

# Email Schemas
class EmailBase(BaseModel):
    thread_id: Optional[str] = None
    subject: str
    sender_name: Optional[str] = None
    sender_email: str
    recipient_email: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    date_received: datetime
    status: EmailStatus = EmailStatus.UNREAD
    priority: EmailPriority = EmailPriority.MEDIUM
    category: Optional[EmailCategory] = None
    is_hiring_related: bool = False
    confidence_score: Optional[str] = None
    labels: Optional[str] = None
    attachments: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    application_id: Optional[str] = None
    notes: Optional[str] = None

class EmailCreate(EmailBase):
    id: str

class EmailUpdate(BaseModel):
    subject: Optional[str] = None
    status: Optional[EmailStatus] = None
    priority: Optional[EmailPriority] = None
    category: Optional[EmailCategory] = None
    is_hiring_related: Optional[bool] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    application_id: Optional[str] = None
    notes: Optional[str] = None

class EmailSchema(EmailBase):
    id: str
    is_synced: bool
    last_sync_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailFilter(BaseModel):
    status: Optional[EmailStatus] = None
    category: Optional[EmailCategory] = None
    is_hiring_related: Optional[bool] = None
    sender_email: Optional[str] = None
    company_name: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

# Calendar Event Schemas
class CalendarEventBase(BaseModel):
    calendar_id: str
    summary: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    timezone: Optional[str] = None
    is_all_day: bool = False
    status: EventStatus = EventStatus.CONFIRMED
    event_type: Optional[EventType] = None
    is_hiring_related: bool = False
    confidence_score: Optional[str] = None
    organizer_email: Optional[str] = None
    organizer_name: Optional[str] = None
    attendees: Optional[str] = None
    meeting_link: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    application_id: Optional[str] = None
    interview_round: Optional[str] = None
    notes: Optional[str] = None
    reminder_sent: bool = False

class CalendarEventCreate(CalendarEventBase):
    id: str

class CalendarEventUpdate(BaseModel):
    summary: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[EventStatus] = None
    event_type: Optional[EventType] = None
    is_hiring_related: Optional[bool] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    application_id: Optional[str] = None
    interview_round: Optional[str] = None
    notes: Optional[str] = None
    reminder_sent: Optional[bool] = None

class CalendarEventSchema(CalendarEventBase):
    id: str
    is_synced: bool
    last_sync_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 

# Todo Schemas
class TodoBase(BaseModel):
    text: str
    completed: bool = False

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None

class Todo(TodoBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Reminder Schemas
class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    reminder_time: str
    reminder_date: datetime
    type: ReminderType = ReminderType.ONE_TIME
    priority: ReminderPriority = ReminderPriority.MEDIUM
    completed: bool = False
    is_active: bool = True
    recurrence_pattern: Optional[str] = None
    next_reminder_date: Optional[datetime] = None

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reminder_time: Optional[str] = None
    reminder_date: Optional[datetime] = None
    type: Optional[ReminderType] = None
    priority: Optional[ReminderPriority] = None
    completed: Optional[bool] = None
    is_active: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    next_reminder_date: Optional[datetime] = None

class Reminder(ReminderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 