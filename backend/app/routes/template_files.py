from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import shutil
from pathlib import Path
from datetime import datetime

from ..models.database import get_db
from ..models.template_file import TemplateFile, TemplateFileType
from ..schemas import TemplateFileCreate, TemplateFileUpdate, TemplateFile as TemplateFileSchema

router = APIRouter()

# Create template uploads directories
TEMPLATE_RESUMES_DIR = Path("uploads/templates/resumes")
TEMPLATE_COVER_LETTERS_DIR = Path("uploads/templates/cover_letters")
TEMPLATE_RESUMES_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATE_COVER_LETTERS_DIR.mkdir(parents=True, exist_ok=True)

def get_upload_dir(file_type: TemplateFileType) -> Path:
    """Get the appropriate upload directory for the file type"""
    if file_type == TemplateFileType.RESUME:
        return TEMPLATE_RESUMES_DIR
    else:
        return TEMPLATE_COVER_LETTERS_DIR

def save_template_file(file: UploadFile, file_type: TemplateFileType) -> tuple[str, str]:
    """Save template file and return filename and file path"""
    upload_dir = get_upload_dir(file_type)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else '.pdf'
    system_filename = f"{uuid.uuid4()}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    file_path = upload_dir / system_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return original filename and system path
    original_filename = file.filename if file.filename else f"template{file_extension}"
    return original_filename, str(file_path)

@router.post("/", response_model=TemplateFileSchema)
async def create_template_file(
    name: str = Form(...),
    file_type: TemplateFileType = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a new template file"""
    
    # Validate file type
    allowed_extensions = {'.pdf', '.doc', '.docx'}
    file_extension = Path(file.filename).suffix.lower() if file.filename else ''
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save file
    filename, file_path = save_template_file(file, file_type)
    
    # Create database record
    db_template = TemplateFile(
        name=name,
        file_type=file_type,
        filename=filename,
        file_path=file_path,
        description=description
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/", response_model=List[TemplateFileSchema])
def get_template_files(
    file_type: Optional[TemplateFileType] = None, 
    db: Session = Depends(get_db)
):
    """Get all template files, optionally filtered by type"""
    query = db.query(TemplateFile)
    if file_type:
        query = query.filter(TemplateFile.file_type == file_type)
    
    templates = query.order_by(TemplateFile.created_at.desc()).all()
    return templates

@router.get("/{template_id}", response_model=TemplateFileSchema)
def get_template_file(template_id: str, db: Session = Depends(get_db)):
    """Get a specific template file by ID"""
    template = db.query(TemplateFile).filter(TemplateFile.id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template file not found")
    return template

@router.get("/{template_id}/download")
async def download_template_file(template_id: str, db: Session = Depends(get_db)):
    """Download a template file"""
    template = db.query(TemplateFile).filter(TemplateFile.id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template file not found")
    
    file_path = Path(template.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=template.filename,
        media_type='application/octet-stream'
    )

@router.put("/{template_id}", response_model=TemplateFileSchema)
def update_template_file(
    template_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Update template file metadata (name, description)"""
    template = db.query(TemplateFile).filter(TemplateFile.id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template file not found")
    
    if name is not None:
        template.name = name
    if description is not None:
        template.description = description
    
    db.commit()
    db.refresh(template)
    return template

@router.delete("/{template_id}")
def delete_template_file(template_id: str, db: Session = Depends(get_db)):
    """Delete a template file"""
    template = db.query(TemplateFile).filter(TemplateFile.id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template file not found")
    
    # Delete file from disk
    file_path = Path(template.file_path)
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    db.delete(template)
    db.commit()
    
    return {"message": "Template file deleted successfully"} 