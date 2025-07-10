from sqlalchemy import Column, String, DateTime, Text, Enum, func
from sqlalchemy.ext.declarative import declarative_base
from .database import Base
import enum
import uuid

class TemplateFileType(enum.Enum):
    RESUME = "resume"
    COVER_LETTER = "cover_letter"

class TemplateFile(Base):
    __tablename__ = "template_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False)  # User-friendly name for the template
    file_type = Column(Enum(TemplateFileType), nullable=False, index=True)
    filename = Column(String, nullable=False)  # Original filename
    file_path = Column(String, nullable=False)  # Storage path
    description = Column(Text, nullable=True)  # Optional description
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<TemplateFile(id={self.id}, name={self.name}, type={self.file_type})>" 