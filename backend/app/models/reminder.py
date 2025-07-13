from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum, func
from .database import Base
import enum
import uuid

class ReminderType(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ONE_TIME = "one_time"

class ReminderPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Reminder(Base):
    __tablename__ = 'reminders'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    reminder_time = Column(String, nullable=False)  # Time format like "8:00 am"
    reminder_date = Column(DateTime, nullable=False, index=True)  # When the reminder is due
    type = Column(Enum(ReminderType), default=ReminderType.ONE_TIME, index=True)
    priority = Column(Enum(ReminderPriority), default=ReminderPriority.MEDIUM, index=True)
    completed = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Recurring reminder settings
    recurrence_pattern = Column(String, nullable=True)  # For recurring reminders
    next_reminder_date = Column(DateTime, nullable=True, index=True)  # When the next occurrence is due
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Reminder(id={self.id}, title={self.title}, time={self.reminder_time})>" 