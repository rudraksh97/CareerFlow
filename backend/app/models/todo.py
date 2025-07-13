from sqlalchemy import Column, String, Boolean, DateTime, func
from .database import Base
import uuid

class Todo(Base):
    __tablename__ = 'todos'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    text = Column(String, nullable=False)
    completed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False) 