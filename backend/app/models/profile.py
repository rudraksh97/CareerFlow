from sqlalchemy import Column, String, Integer
from .database import Base

class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, default=1)
    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    headline = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True) 