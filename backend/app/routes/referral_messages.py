from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import re

from ..models.database import get_db
from ..models.referral_message import ReferralMessage as ReferralMessageModel, ReferralMessageType
from ..schemas import (
    ReferralMessageCreate, 
    ReferralMessageUpdate, 
    ReferralMessage as ReferralMessageSchema,
    GenerateReferralMessageRequest,
    GeneratedReferralMessage
)

router = APIRouter()

def generate_id():
    """Generate a unique ID for new referral messages"""
    return str(uuid.uuid4())

@router.post("/", response_model=ReferralMessageSchema)
def create_referral_message(
    message: ReferralMessageCreate,
    db: Session = Depends(get_db)
):
    """Create a new referral message template"""
    db_message = ReferralMessageModel(
        id=generate_id(),
        title=message.title,
        message_type=message.message_type,
        subject_template=message.subject_template,
        message_template=message.message_template,
        target_company=message.target_company,
        target_position=message.target_position,
        is_active=message.is_active,
        notes=message.notes,
        usage_count="0"
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/", response_model=List[ReferralMessageSchema])
def get_referral_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    message_type: Optional[ReferralMessageType] = None,
    target_company: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all referral message templates with optional filtering"""
    query = db.query(ReferralMessageModel)
    
    # Apply filters
    if message_type:
        query = query.filter(ReferralMessageModel.message_type == message_type)
    if target_company:
        query = query.filter(ReferralMessageModel.target_company.ilike(f"%{target_company}%"))
    if is_active is not None:
        query = query.filter(ReferralMessageModel.is_active == is_active)
    
    messages = query.order_by(ReferralMessageModel.created_at.desc()).offset(skip).limit(limit).all()
    return messages

@router.get("/{message_id}", response_model=ReferralMessageSchema)
def get_referral_message(message_id: str, db: Session = Depends(get_db)):
    """Get a specific referral message template by ID"""
    message = db.query(ReferralMessageModel).filter(ReferralMessageModel.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Referral message not found")
    return message

@router.put("/{message_id}", response_model=ReferralMessageSchema)
def update_referral_message(
    message_id: str,
    message_update: ReferralMessageUpdate,
    db: Session = Depends(get_db)
):
    """Update a referral message template"""
    message = db.query(ReferralMessageModel).filter(ReferralMessageModel.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Referral message not found")
    
    # Update fields that were provided
    update_data = message_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(message, field, value)
    
    db.commit()
    db.refresh(message)
    return message

@router.delete("/{message_id}")
def delete_referral_message(message_id: str, db: Session = Depends(get_db)):
    """Delete a referral message template"""
    message = db.query(ReferralMessageModel).filter(ReferralMessageModel.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Referral message not found")
    
    db.delete(message)
    db.commit()
    return {"message": "Referral message deleted successfully"}

@router.post("/{message_id}/duplicate", response_model=ReferralMessageSchema)
def duplicate_referral_message(message_id: str, db: Session = Depends(get_db)):
    """Create a duplicate of an existing referral message template"""
    original_message = db.query(ReferralMessageModel).filter(ReferralMessageModel.id == message_id).first()
    if not original_message:
        raise HTTPException(status_code=404, detail="Referral message not found")
    
    # Create a duplicate with a modified title
    duplicate_title = f"{original_message.title} (Copy)"
    counter = 1
    while db.query(ReferralMessageModel).filter(ReferralMessageModel.title == duplicate_title).first():
        duplicate_title = f"{original_message.title} (Copy {counter})"
        counter += 1
    
    db_duplicate = ReferralMessageModel(
        id=generate_id(),
        title=duplicate_title,
        message_type=original_message.message_type,
        subject_template=original_message.subject_template,
        message_template=original_message.message_template,
        target_company=original_message.target_company,
        target_position=original_message.target_position,
        is_active=True,  # New duplicates are active by default
        notes=original_message.notes,
        usage_count="0"  # Reset usage count for duplicate
    )
    
    db.add(db_duplicate)
    db.commit()
    db.refresh(db_duplicate)
    return db_duplicate

@router.post("/generate", response_model=GeneratedReferralMessage)
def generate_personalized_message(
    request: GenerateReferralMessageRequest,
    db: Session = Depends(get_db)
):
    """Generate a personalized message from a template"""
    template = db.query(ReferralMessageModel).filter(ReferralMessageModel.id == request.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Prepare variables for substitution
    variables = {
        "contact_name": request.contact_name or "[Contact Name]",
        "company_name": request.company_name or "[Company Name]",
        "position_title": request.position_title or "[Position Title]",
        "your_name": request.your_name or "[Your Name]",
        "your_background": request.your_background or "[Your Background]"
    }
    
    # Add custom variables if provided
    if request.custom_variables:
        variables.update(request.custom_variables)
    
    # Replace placeholders in the message template
    personalized_message = template.message_template
    personalized_subject = template.subject_template
    
    for key, value in variables.items():
        placeholder = "{" + key + "}"
        personalized_message = personalized_message.replace(placeholder, str(value))
        if personalized_subject:
            personalized_subject = personalized_subject.replace(placeholder, str(value))
    
    # Increment usage count
    try:
        current_count = int(template.usage_count)
        template.usage_count = str(current_count + 1)
        db.commit()
    except (ValueError, TypeError):
        # If usage_count is not a valid integer, reset it to 1
        template.usage_count = "1"
        db.commit()
    
    return GeneratedReferralMessage(
        subject=personalized_subject,
        message=personalized_message,
        template_title=template.title,
        variables_used=variables
    )

@router.get("/types/", response_model=List[str])
def get_message_types():
    """Get all available referral message types"""
    return [message_type.value for message_type in ReferralMessageType]

@router.get("/analytics/usage", response_model=dict)
def get_usage_analytics(db: Session = Depends(get_db)):
    """Get analytics about referral message template usage"""
    messages = db.query(ReferralMessageModel).all()
    
    total_templates = len(messages)
    active_templates = len([m for m in messages if m.is_active])
    
    # Calculate total usage
    total_usage = 0
    usage_by_type = {}
    
    for message in messages:
        try:
            usage = int(message.usage_count)
            total_usage += usage
            
            type_key = message.message_type.value
            if type_key not in usage_by_type:
                usage_by_type[type_key] = 0
            usage_by_type[type_key] += usage
        except (ValueError, TypeError):
            continue
    
    # Find most used template
    most_used = None
    max_usage = 0
    for message in messages:
        try:
            usage = int(message.usage_count)
            if usage > max_usage:
                max_usage = usage
                most_used = {
                    "id": message.id,
                    "title": message.title,
                    "usage_count": usage
                }
        except (ValueError, TypeError):
            continue
    
    return {
        "total_templates": total_templates,
        "active_templates": active_templates,
        "total_usage": total_usage,
        "usage_by_type": usage_by_type,
        "most_used_template": most_used
    } 