from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from datetime import datetime, timedelta
from ..models.database import get_db
from ..models.reminder import Reminder as ReminderModel, ReminderType, ReminderPriority
from ..schemas import Reminder, ReminderCreate, ReminderUpdate

router = APIRouter()

@router.get("/", response_model=List[Reminder])
def list_reminders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    completed: Optional[bool] = None,
    type: Optional[ReminderType] = None,
    priority: Optional[ReminderPriority] = None,
    upcoming_only: bool = Query(False),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get reminders with filtering options"""
    
    query = db.query(ReminderModel)
    
    # Apply filters
    if completed is not None:
        query = query.filter(ReminderModel.completed == completed)
    if type:
        query = query.filter(ReminderModel.type == type)
    if priority:
        query = query.filter(ReminderModel.priority == priority)
    if active_only:
        query = query.filter(ReminderModel.is_active == True)
    if upcoming_only:
        query = query.filter(ReminderModel.reminder_date >= datetime.utcnow())
    
    # Order by reminder date (upcoming first if filtering for upcoming)
    if upcoming_only:
        query = query.order_by(asc(ReminderModel.reminder_date))
    else:
        query = query.order_by(desc(ReminderModel.created_at))
    
    # Apply pagination
    reminders = query.offset(skip).limit(limit).all()
    return reminders

@router.get("/today", response_model=List[Reminder])
def get_today_reminders(db: Session = Depends(get_db)):
    """Get reminders for today"""
    
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    reminders = db.query(ReminderModel).filter(
        ReminderModel.reminder_date >= datetime.combine(today, datetime.min.time()),
        ReminderModel.reminder_date < datetime.combine(tomorrow, datetime.min.time()),
        ReminderModel.is_active == True
    ).order_by(ReminderModel.reminder_time).all()
    
    return reminders

@router.get("/upcoming", response_model=List[Reminder])
def get_upcoming_reminders(
    days_ahead: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Get upcoming reminders for the next N days"""
    
    now = datetime.utcnow()
    end_date = now + timedelta(days=days_ahead)
    
    reminders = db.query(ReminderModel).filter(
        ReminderModel.reminder_date >= now,
        ReminderModel.reminder_date <= end_date,
        ReminderModel.is_active == True,
        ReminderModel.completed == False
    ).order_by(asc(ReminderModel.reminder_date)).all()
    
    return reminders

@router.post("/", response_model=Reminder)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db)):
    """Create a new reminder"""
    
    db_reminder = ReminderModel(
        title=reminder.title,
        description=reminder.description,
        reminder_time=reminder.reminder_time,
        reminder_date=reminder.reminder_date,
        type=reminder.type,
        priority=reminder.priority,
        completed=reminder.completed,
        is_active=reminder.is_active,
        recurrence_pattern=reminder.recurrence_pattern,
        next_reminder_date=reminder.next_reminder_date
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/{reminder_id}", response_model=Reminder)
def get_reminder(reminder_id: str, db: Session = Depends(get_db)):
    """Get a specific reminder by ID"""
    
    reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder

@router.put("/{reminder_id}", response_model=Reminder)
def update_reminder(reminder_id: str, reminder: ReminderUpdate, db: Session = Depends(get_db)):
    """Update an existing reminder"""
    
    db_reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Update fields that were provided
    update_data = reminder.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reminder, field, value)
    
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.patch("/{reminder_id}/complete")
def toggle_reminder_completion(reminder_id: str, db: Session = Depends(get_db)):
    """Toggle reminder completion status"""
    
    db_reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db_reminder.completed = not db_reminder.completed
    db.commit()
    db.refresh(db_reminder)
    return {"ok": True, "completed": db_reminder.completed}

@router.delete("/{reminder_id}", response_model=dict)
def delete_reminder(reminder_id: str, db: Session = Depends(get_db)):
    """Delete a reminder"""
    
    db_reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(db_reminder)
    db.commit()
    return {"ok": True} 