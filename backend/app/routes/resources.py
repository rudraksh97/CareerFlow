from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime
import uuid

from ..models.database import get_db
from ..models.resource import Resource as ResourceModel, ResourceGroup as ResourceGroupModel
from ..schemas import (
    ResourceCreate, 
    ResourceUpdate, 
    Resource as ResourceSchema,
    ResourceGroupCreate,
    ResourceGroupUpdate,
    ResourceGroup as ResourceGroupSchema,
    ResourceAnalytics
)

router = APIRouter()

def generate_id():
    """Generate a unique ID for new resources/groups"""
    return str(uuid.uuid4())

# Resource Group Endpoints
@router.post("/groups/", response_model=ResourceGroupSchema)
def create_resource_group(
    group: ResourceGroupCreate,
    db: Session = Depends(get_db)
):
    """Create a new resource group"""
    db_group = ResourceGroupModel(
        id=generate_id(),
        **group.model_dump()
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/groups/", response_model=List[ResourceGroupSchema])
def get_resource_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    name: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all resource groups with optional filtering"""
    query = db.query(ResourceGroupModel)
    
    # Apply filters
    if name:
        query = query.filter(ResourceGroupModel.name.ilike(f"%{name}%"))
    if is_active is not None:
        query = query.filter(ResourceGroupModel.is_active == is_active)
    
    groups = query.order_by(ResourceGroupModel.created_at.desc()).offset(skip).limit(limit).all()
    return groups

@router.get("/groups/{group_id}", response_model=ResourceGroupSchema)
def get_resource_group(group_id: str, db: Session = Depends(get_db)):
    """Get a specific resource group by ID"""
    group = db.query(ResourceGroupModel).filter(ResourceGroupModel.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Resource group not found")
    return group

@router.put("/groups/{group_id}", response_model=ResourceGroupSchema)
def update_resource_group(
    group_id: str,
    group_update: ResourceGroupUpdate,
    db: Session = Depends(get_db)
):
    """Update a resource group"""
    db_group = db.query(ResourceGroupModel).filter(ResourceGroupModel.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Resource group not found")
    
    update_data = group_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_group, key, value)
    
    db.commit()
    db.refresh(db_group)
    return db_group

@router.delete("/groups/{group_id}")
def delete_resource_group(group_id: str, db: Session = Depends(get_db)):
    """Delete a resource group and move its resources to ungrouped"""
    db_group = db.query(ResourceGroupModel).filter(ResourceGroupModel.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Resource group not found")
    
    # Move all resources in this group to ungrouped (set group_id to None)
    db.query(ResourceModel).filter(ResourceModel.group_id == group_id).update({"group_id": None})
    
    db.delete(db_group)
    db.commit()
    return {"message": "Resource group deleted successfully"}

# Resource Endpoints
@router.post("/", response_model=ResourceSchema)
def create_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db)
):
    """Create a new resource"""
    resource_data = resource.model_dump()
    if resource_data.get("url"):
        resource_data["url"] = str(resource_data["url"])
    
    # Validate group_id if provided
    if resource_data.get("group_id"):
        group = db.query(ResourceGroupModel).filter(ResourceGroupModel.id == resource_data["group_id"]).first()
        if not group:
            raise HTTPException(status_code=400, detail="Invalid group_id: Group not found")
    
    db_resource = ResourceModel(
        id=generate_id(),
        **resource_data
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.get("/", response_model=List[ResourceSchema])
def get_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    name: Optional[str] = None,
    group_id: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    tags: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all resources with optional filtering"""
    query = db.query(ResourceModel)
    
    # Apply filters
    if name:
        query = query.filter(ResourceModel.name.ilike(f"%{name}%"))
    if group_id:
        query = query.filter(ResourceModel.group_id == group_id)
    if is_favorite is not None:
        query = query.filter(ResourceModel.is_favorite == is_favorite)
    if tags:
        query = query.filter(ResourceModel.tags.ilike(f"%{tags}%"))
    
    resources = query.order_by(ResourceModel.created_at.desc()).offset(skip).limit(limit).all()
    return resources

@router.get("/{resource_id}", response_model=ResourceSchema)
def get_resource(resource_id: str, db: Session = Depends(get_db)):
    """Get a specific resource by ID"""
    resource = db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.put("/{resource_id}", response_model=ResourceSchema)
def update_resource(
    resource_id: str,
    resource_update: ResourceUpdate,
    db: Session = Depends(get_db)
):
    """Update a resource"""
    db_resource = db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    update_data = resource_update.model_dump(exclude_unset=True)
    if update_data.get("url"):
        update_data["url"] = str(update_data["url"])
    
    # Validate group_id if provided
    if update_data.get("group_id"):
        group = db.query(ResourceGroupModel).filter(ResourceGroupModel.id == update_data["group_id"]).first()
        if not group:
            raise HTTPException(status_code=400, detail="Invalid group_id: Group not found")
    
    for key, value in update_data.items():
        setattr(db_resource, key, value)
    
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.delete("/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db)):
    """Delete a resource"""
    db_resource = db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    db.delete(db_resource)
    db.commit()
    return {"message": "Resource deleted successfully"}

@router.post("/{resource_id}/visit")
def visit_resource(resource_id: str, db: Session = Depends(get_db)):
    """Track a visit to a resource (increment visit count and update last_visited)"""
    db_resource = db.query(ResourceModel).filter(ResourceModel.id == resource_id).first()
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Increment visit count
    current_count = int(db_resource.visit_count) if db_resource.visit_count.isdigit() else 0
    db_resource.visit_count = str(current_count + 1)
    db_resource.last_visited = datetime.utcnow()
    
    db.commit()
    return {"message": "Visit recorded successfully", "visit_count": db_resource.visit_count}

@router.get("/analytics/overview", response_model=ResourceAnalytics)
def get_resource_analytics(db: Session = Depends(get_db)):
    """Get resource analytics overview"""
    
    total_resources = db.query(ResourceModel).count()
    total_groups = db.query(ResourceGroupModel).filter(ResourceGroupModel.is_active == True).count()
    favorites_count = db.query(ResourceModel).filter(ResourceModel.is_favorite == True).count()
    
    # Most visited resources (top 5)
    most_visited = db.query(ResourceModel).order_by(
        func.cast(ResourceModel.visit_count, db.Integer).desc()
    ).limit(5).all()
    
    # Recent resources (last 10)
    recent_resources = db.query(ResourceModel).order_by(
        ResourceModel.created_at.desc()
    ).limit(10).all()
    
    return ResourceAnalytics(
        total_resources=total_resources,
        total_groups=total_groups,
        favorites_count=favorites_count,
        most_visited=most_visited,
        recent_resources=recent_resources
    )

@router.get("/groups/{group_id}/resources", response_model=List[ResourceSchema])
def get_resources_by_group(
    group_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all resources for a specific group"""
    # Verify group exists
    group = db.query(ResourceGroupModel).filter(ResourceGroupModel.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Resource group not found")
    
    resources = db.query(ResourceModel).filter(
        ResourceModel.group_id == group_id
    ).order_by(ResourceModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return resources

@router.get("/ungrouped/", response_model=List[ResourceSchema])
def get_ungrouped_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all resources that are not assigned to any group"""
    resources = db.query(ResourceModel).filter(
        ResourceModel.group_id.is_(None)
    ).order_by(ResourceModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return resources 