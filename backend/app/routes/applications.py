from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
import uuid
import os
import shutil
from pathlib import Path

from ..models.database import get_db
from ..models.application import Application, ApplicationStatus, ApplicationSource
from ..schemas import ApplicationCreate, ApplicationUpdate, Application as ApplicationSchema, ApplicationFilter

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("uploads/resumes")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def generate_id():
    return str(uuid.uuid4())

def save_resume_file(file: UploadFile, application_id: str) -> tuple[str, str]:
    """Save resume file and return filename and file path"""
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else '.pdf'
    filename = f"{application_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return filename, str(file_path)

@router.post("/", response_model=ApplicationSchema)
async def create_application(
    company_name: str = Form(...),
    job_title: str = Form(...),
    job_id: str = Form(...),
    job_url: str = Form(...),
    portal_url: Optional[str] = Form(None),
    status: ApplicationStatus = Form(ApplicationStatus.APPLIED),
    date_applied: datetime = Form(...),
    email_used: str = Form(...),
    source: ApplicationSource = Form(...),
    notes: Optional[str] = Form(None),
    max_applications: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Create a new job application with resume file upload"""
    
    # Validate file type
    allowed_extensions = {'.pdf', '.doc', '.docx'}
    file_extension = Path(resume.filename).suffix.lower() if resume.filename else ''
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Generate application ID
    application_id = generate_id()
    
    # Save resume file
    filename, file_path = save_resume_file(resume, application_id)
    
    # Create application
    db_application = Application(
        id=application_id,
        company_name=company_name,
        job_title=job_title,
        job_id=job_id,
        job_url=job_url,
        portal_url=portal_url,
        status=status,
        date_applied=date_applied,
        email_used=email_used,
        resume_filename=filename,
        resume_file_path=file_path,
        source=source,
        notes=notes,
        max_applications=max_applications
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

@router.get("/{application_id}/resume")
async def download_resume(application_id: str, db: Session = Depends(get_db)):
    """Download resume file for an application"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    file_path = Path(application.resume_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    return FileResponse(
        path=file_path,
        filename=application.resume_filename,
        media_type='application/octet-stream'
    )

@router.get("/", response_model=List[ApplicationSchema])
def get_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    company_name: Optional[str] = None,
    status: Optional[ApplicationStatus] = None,
    source: Optional[ApplicationSource] = None,
    email_used: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all applications with optional filtering"""
    query = db.query(Application)
    
    # Apply filters
    if company_name:
        query = query.filter(Application.company_name.ilike(f"%{company_name}%"))
    if status:
        query = query.filter(Application.status == status)
    if source:
        query = query.filter(Application.source == source)
    if email_used:
        query = query.filter(Application.email_used.ilike(f"%{email_used}%"))
    
    applications = query.offset(skip).limit(limit).all()
    return applications

@router.get("/recent/", response_model=List[ApplicationSchema])
def get_recent_applications(db: Session = Depends(get_db)):
    """Get the 5 most recent applications"""
    applications = db.query(Application).order_by(Application.created_at.desc()).limit(5).all()
    return applications

@router.get("/{application_id}/", response_model=ApplicationSchema)
def get_application(application_id: str, db: Session = Depends(get_db)):
    """Get a specific application by ID"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@router.put("/{application_id}", response_model=ApplicationSchema)
def update_application(
    application_id: str,
    application_update: ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing application"""
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = application_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_application, field, value)
    
    db_application.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_application)
    return db_application

@router.delete("/{application_id}")
def delete_application(application_id: str, db: Session = Depends(get_db)):
    """Delete an application"""
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(db_application)
    db.commit()
    return {"message": "Application deleted successfully"}

@router.get("/search/", response_model=List[ApplicationSchema])
def search_applications(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """Search applications by company name, job title, or job ID"""
    query = db.query(Application).filter(
        or_(
            Application.company_name.ilike(f"%{q}%"),
            Application.job_title.ilike(f"%{q}%"),
            Application.job_id.ilike(f"%{q}%")
        )
    )
    applications = query.all()
    return applications

@router.get("/analytics/summary")
def get_application_analytics(db: Session = Depends(get_db)):
    """Get analytics summary for applications"""
    total_applications = db.query(Application).count()
    
    # Applications by status
    status_counts = {}
    for status in ApplicationStatus:
        count = db.query(Application).filter(Application.status == status).count()
        status_counts[status.value] = count
    
    # Applications by source
    source_counts = {}
    for source in ApplicationSource:
        count = db.query(Application).filter(Application.source == source).count()
        source_counts[source.value] = count
    
    # Success rate (interviews + offers / total)
    successful = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER])
    ).count()
    success_rate = (successful / total_applications * 100) if total_applications > 0 else 0
    
    return {
        "total_applications": total_applications,
        "applications_by_status": status_counts,
        "applications_by_source": source_counts,
        "success_rate": round(success_rate, 2)
    } 