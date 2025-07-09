from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import uuid

from ..models.database import get_db
from ..models.contact import Contact, ContactType, Interaction
from ..schemas import ContactCreate, ContactUpdate, Contact as ContactSchema, InteractionCreate, Interaction as InteractionSchema

router = APIRouter()

def generate_id():
    return str(uuid.uuid4())

@router.post("/", response_model=ContactSchema)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db)
):
    """Create a new contact"""
    db_contact = Contact(
        id=generate_id(),
        name=contact.name,
        email=contact.email,
        company=contact.company,
        role=contact.role,
        linkedin_url=str(contact.linkedin_url),  # Convert URL to string
        contact_type=contact.contact_type,
        notes=contact.notes
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.get("/", response_model=List[ContactSchema])
def get_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    name: Optional[str] = None,
    company: Optional[str] = None,
    contact_type: Optional[ContactType] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all contacts with optional filtering"""
    query = db.query(Contact)
    
    # Apply filters
    if name:
        query = query.filter(Contact.name.ilike(f"%{name}%"))
    if company:
        query = query.filter(Contact.company.ilike(f"%{company}%"))
    if contact_type:
        query = query.filter(Contact.contact_type == contact_type)
    if email:
        query = query.filter(Contact.email.ilike(f"%{email}%"))
    
    contacts = query.offset(skip).limit(limit).all()
    return contacts

@router.get("/{contact_id}/", response_model=ContactSchema)
def get_contact(contact_id: str, db: Session = Depends(get_db)):
    """Get a specific contact by ID"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/{contact_id}/", response_model=ContactSchema)
def update_contact(
    contact_id: str,
    contact_update: ContactUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing contact"""
    db_contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contact, field, value)
    
    db_contact.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.delete("/{contact_id}/")
def delete_contact(contact_id: str, db: Session = Depends(get_db)):
    """Delete a contact"""
    db_contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(db_contact)
    db.commit()
    return {"message": "Contact deleted successfully"}

@router.get("/search/", response_model=List[ContactSchema])
def search_contacts(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """Search contacts by name, company, or email"""
    query = db.query(Contact).filter(
        or_(
            Contact.name.ilike(f"%{q}%"),
            Contact.company.ilike(f"%{q}%"),
            Contact.email.ilike(f"%{q}%")
        )
    )
    contacts = query.all()
    return contacts

# Interaction endpoints
@router.post("/{contact_id}/interactions/", response_model=InteractionSchema)
def create_interaction(
    contact_id: str,
    interaction: InteractionCreate,
    db: Session = Depends(get_db)
):
    """Create a new interaction for a contact"""
    # Verify contact exists
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db_interaction = Interaction(
        id=generate_id(),
        contact_id=contact_id,
        **interaction.dict()
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@router.get("/{contact_id}/interactions/", response_model=List[InteractionSchema])
def get_contact_interactions(
    contact_id: str,
    db: Session = Depends(get_db)
):
    """Get all interactions for a specific contact"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    interactions = db.query(Interaction).filter(Interaction.contact_id == contact_id).all()
    return interactions

@router.get("/analytics/summary/")
def get_contact_analytics(db: Session = Depends(get_db)):
    """Get analytics summary for contacts"""
    total_contacts = db.query(Contact).count()
    
    # Contacts by type
    type_counts = {}
    for contact_type in ContactType:
        count = db.query(Contact).filter(Contact.contact_type == contact_type).count()
        type_counts[contact_type.value] = count
    
    # Contacts by company
    company_counts = db.query(Contact.company, db.func.count(Contact.id)).group_by(Contact.company).all()
    company_data = {company: count for company, count in company_counts}
    
    # Recent interactions
    recent_interactions = db.query(Interaction).order_by(Interaction.date.desc()).limit(10).all()
    
    return {
        "total_contacts": total_contacts,
        "contacts_by_type": type_counts,
        "contacts_by_company": company_data,
        "recent_interactions": recent_interactions
    } 