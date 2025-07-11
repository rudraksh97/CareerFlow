from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import uuid

class ResourceGroup(Base):
    __tablename__ = "resource_groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True)  # Optional color for UI grouping
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship with resources
    resources = relationship("Resource", back_populates="group", cascade="all, delete-orphan")

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_name_active', 'name', 'is_active'),
    )

    def __repr__(self):
        return f"<ResourceGroup(id={self.id}, name={self.name})>"

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False, index=True)
    url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign key to resource group - nullable to allow ungrouped resources
    group_id = Column(String, ForeignKey("resource_groups.id"), nullable=True, index=True)
    
    # Additional metadata
    tags = Column(String, nullable=True)  # Comma-separated tags for additional organization
    is_favorite = Column(Boolean, default=False, index=True)
    visit_count = Column(String, default="0")  # Track how many times resource was accessed
    last_visited = Column(DateTime, nullable=True)
    
    # Standard timestamps
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship with group
    group = relationship("ResourceGroup", back_populates="resources")

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_group_favorite', 'group_id', 'is_favorite'),
        Index('idx_name_group', 'name', 'group_id'),
        Index('idx_favorite_created', 'is_favorite', 'created_at'),
    )

    def __repr__(self):
        return f"<Resource(id={self.id}, name={self.name}, url={self.url})>" 