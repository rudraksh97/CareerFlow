from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..models.database import get_db
from ..models.application import Application
from ..schemas import Application as ApplicationSchema

router = APIRouter()

@router.get("/", response_model=List[ApplicationSchema])
def get_all_resumes(db: Session = Depends(get_db)):
    """
    Get all applications that have a resume.
    """
    applications = db.query(Application).filter(Application.resume_filename.isnot(None)).order_by(Application.date_applied.desc()).all()
    return applications 