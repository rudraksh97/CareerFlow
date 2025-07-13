from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta
import json

from ..models.database import get_db
from ..models.email import Email, EmailStatus, EmailPriority, EmailCategory
from ..models.setting import Setting as SettingModel
from ..services.google_api_service import GoogleAPIService
from ..services.email_filtering_service import EmailFilteringService
from ..services.openai_service import OpenAIService
from ..schemas import EmailSchema, EmailCreate, EmailUpdate, EmailFilter

router = APIRouter()

def get_google_service(db: Session = Depends(get_db)) -> GoogleAPIService:
    """Get Google API service instance"""
    try:
        token_path_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        
        # We don't need credentials.json for OAuth flow, just token.json
        credentials_path = None  # Not needed for OAuth flow
        token_path = token_path_setting.value if token_path_setting else None
        
        if not token_path:
            raise HTTPException(status_code=401, detail="Google account not connected. Please connect your Google account first.")
        
        service = GoogleAPIService(credentials_path, token_path)
        if not service.authenticate():
            raise HTTPException(status_code=401, detail="Google API authentication failed. Please reconnect your Google account.")
        
        return service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Google API service: {str(e)}")

def get_email_filtering_service(db: Session = Depends(get_db)) -> EmailFilteringService:
    """Get email filtering service instance"""
    try:
        # Get OpenAI API key
        api_key_setting = db.query(SettingModel).filter(SettingModel.key == "openai_api_key").first()
        if not api_key_setting or not api_key_setting.value:
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")
        
        openai_service = OpenAIService(api_key_setting.value)
        return EmailFilteringService(openai_service)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize email filtering service: {str(e)}")

@router.get("/", response_model=List[EmailSchema])
async def get_emails(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[EmailStatus] = None,
    category: Optional[EmailCategory] = None,
    is_hiring_related: Optional[bool] = None,
    sender_email: Optional[str] = None,
    company_name: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get emails with filtering options"""
    
    query = db.query(Email)
    
    # Apply filters
    if status:
        query = query.filter(Email.status == status)
    if category:
        query = query.filter(Email.category == category)
    if is_hiring_related is not None:
        query = query.filter(Email.is_hiring_related == is_hiring_related)
    if sender_email:
        query = query.filter(Email.sender_email.ilike(f"%{sender_email}%"))
    if company_name:
        query = query.filter(Email.company_name.ilike(f"%{company_name}%"))
    if search:
        search_filter = or_(
            Email.subject.ilike(f"%{search}%"),
            Email.body_text.ilike(f"%{search}%"),
            Email.sender_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    if date_from:
        query = query.filter(Email.date_received >= date_from)
    if date_to:
        query = query.filter(Email.date_received <= date_to)
    
    # Order by date received (newest first)
    query = query.order_by(desc(Email.date_received))
    
    # Apply pagination
    emails = query.offset(skip).limit(limit).all()
    return emails

@router.get("/{email_id}", response_model=EmailSchema)
async def get_email(email_id: str, db: Session = Depends(get_db)):
    """Get specific email by ID"""
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    return email

@router.post("/sync")
async def sync_emails(
    background_tasks: BackgroundTasks,
    days_back: int = Query(7, ge=1, le=30),
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
    google_service: GoogleAPIService = Depends(get_google_service),
    filtering_service: EmailFilteringService = Depends(get_email_filtering_service)
):
    """Sync emails from Gmail"""
    
    try:
        # Add background task for email syncing
        background_tasks.add_task(
            sync_emails_background,
            db, google_service, filtering_service, days_back, force_refresh
        )
        
        return {
            "message": "Email sync started", 
            "days_back": days_back,
            "note": "Sync includes spam folder but filters out non-legitimate emails"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start email sync: {str(e)}")

async def sync_emails_background(
    db: Session,
    google_service: GoogleAPIService,
    filtering_service: EmailFilteringService,
    days_back: int,
    force_refresh: bool
):
    """Background task to sync emails from Gmail"""
    
    try:
        print(f"[INFO] Starting email sync for {days_back} days back")
        
        # Search for hiring-related emails
        gmail_data = google_service.search_hiring_related_emails(days_back)
        emails_from_gmail = gmail_data.get('emails', [])
        
        print(f"[INFO] Found {len(emails_from_gmail)} emails from Gmail")
        
        synced_count = 0
        updated_count = 0
        
        for gmail_email in emails_from_gmail:
            try:
                # Check if email already exists
                existing_email = db.query(Email).filter(Email.id == gmail_email['id']).first()
                
                if existing_email and not force_refresh:
                    continue  # Skip existing emails unless force refresh
                
                # Analyze email for hiring relevance
                analysis = filtering_service.analyze_email(gmail_email)
                
                # Prepare email data
                email_data = {
                    'id': gmail_email['id'],
                    'thread_id': gmail_email['thread_id'],
                    'subject': gmail_email['subject'],
                    'sender_name': gmail_email['sender_name'],
                    'sender_email': gmail_email['sender_email'],
                    'recipient_email': gmail_email['recipient_email'],
                    'body_text': gmail_email['body_text'],
                    'body_html': gmail_email['body_html'],
                    'date_received': gmail_email['date_received'],
                    'status': EmailStatus.UNREAD,
                    'priority': EmailPriority[analysis.get('priority', 'medium').upper()],
                    'category': EmailCategory[analysis.get('category', 'OTHER')],
                    'is_hiring_related': analysis.get('is_hiring_related', False),
                    'confidence_score': str(analysis.get('confidence_score', 0.0)),
                    'labels': json.dumps(gmail_email.get('labels', [])),
                    'company_name': analysis.get('company_name'),
                    'job_title': analysis.get('job_title'),
                    'notes': json.dumps(analysis.get('key_details', [])),
                    'is_synced': True,
                    'last_sync_at': datetime.utcnow()
                }
                
                if existing_email:
                    # Update existing email
                    for key, value in email_data.items():
                        if key != 'id':  # Don't update the ID
                            setattr(existing_email, key, value)
                    updated_count += 1
                else:
                    # Create new email
                    new_email = Email(**email_data)
                    db.add(new_email)
                    synced_count += 1
                
                # Commit every 10 emails to avoid large transactions
                if (synced_count + updated_count) % 10 == 0:
                    db.commit()
                    
            except Exception as e:
                print(f"[ERROR] Failed to sync email {gmail_email.get('id', 'unknown')}: {str(e)}")
                continue
        
        # Final commit
        db.commit()
        
        # Log sync results
        original_count = gmail_data.get('original_count', len(emails_from_gmail))
        spam_filtered_count = gmail_data.get('spam_filtered_count', 0)
        
        print(f"[INFO] Email sync completed: {synced_count} new, {updated_count} updated")
        print(f"[INFO] Spam filtering: {original_count} total emails found, {spam_filtered_count} filtered as spam")
        
    except Exception as e:
        print(f"[ERROR] Email sync failed: {str(e)}")
        db.rollback()

@router.put("/{email_id}/status")
async def update_email_status(
    email_id: str,
    status: EmailStatus,
    db: Session = Depends(get_db),
    google_service: GoogleAPIService = Depends(get_google_service)
):
    """Update email status and sync with Gmail"""
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        # Update status in database
        email.status = status
        email.updated_at = datetime.utcnow()
        
        # Sync with Gmail if applicable
        if status == EmailStatus.READ:
            google_service.mark_email_as_read(email_id)
        elif status == EmailStatus.ARCHIVED:
            google_service.archive_email(email_id)
        
        db.commit()
        db.refresh(email)
        
        return {"message": "Email status updated", "status": status.value}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update email status: {str(e)}")

@router.post("/{email_id}/discard")
async def discard_email(
    email_id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Mark email as discarded (non-relevant)"""
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        email.status = EmailStatus.DISCARDED
        email.is_hiring_related = False
        if reason:
            current_notes = json.loads(email.notes) if email.notes else []
            current_notes.append(f"Discarded: {reason}")
            email.notes = json.dumps(current_notes)
        email.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(email)
        
        return {"message": "Email discarded", "reason": reason}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to discard email: {str(e)}")

@router.put("/{email_id}")
async def update_email(
    email_id: str,
    email_update: EmailUpdate,
    db: Session = Depends(get_db)
):
    """Update email details"""
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        # Update fields
        update_data = email_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(email, field, value)
        
        email.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(email)
        
        return email
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update email: {str(e)}")

@router.delete("/{email_id}")
async def delete_email(email_id: str, db: Session = Depends(get_db)):
    """Delete email from database (does not delete from Gmail)"""
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        db.delete(email)
        db.commit()
        
        return {"message": "Email deleted from database"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete email: {str(e)}")

@router.get("/analytics/stats")
async def get_email_analytics(
    days_back: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get email analytics and statistics"""
    
    try:
        # Get emails from the specified time period
        date_from = datetime.utcnow() - timedelta(days=days_back)
        emails = db.query(Email).filter(Email.date_received >= date_from).all()
        
        # Convert to dict format for analysis
        emails_data = []
        for email in emails:
            email_dict = {
                'id': email.id,
                'subject': email.subject,
                'sender_email': email.sender_email,
                'body_text': email.body_text,
                'analysis': {
                    'is_hiring_related': email.is_hiring_related,
                    'confidence_score': float(email.confidence_score) if email.confidence_score else 0.0,
                    'category': email.category.value if email.category else 'OTHER',
                    'ai_analysis_performed': True  # Assume AI was used for stored emails
                }
            }
            emails_data.append(email_dict)
        
        # Use filtering service to generate statistics
        filtering_service = get_email_filtering_service(db)
        stats = filtering_service.get_hiring_statistics(emails_data)
        
        # Add database-specific stats
        stats['date_range'] = {
            'from': date_from.isoformat(),
            'to': datetime.utcnow().isoformat(),
            'days': days_back
        }
        
        # Status breakdown
        status_breakdown = {}
        for email in emails:
            status = email.status.value if email.status else 'unknown'
            status_breakdown[status] = status_breakdown.get(status, 0) + 1
        stats['status_breakdown'] = status_breakdown
        
        return stats
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get email analytics: {str(e)}")

@router.post("/test-connection")
async def test_gmail_connection(google_service: GoogleAPIService = Depends(get_google_service)):
    """Test Gmail API connection"""
    
    try:
        connection_status = google_service.test_connection()
        return {
            "gmail_connected": connection_status.get('gmail', False),
            "message": "Gmail connection successful" if connection_status.get('gmail') else "Gmail connection failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

@router.post("/reanalyze/{email_id}")
async def reanalyze_email(
    email_id: str,
    db: Session = Depends(get_db),
    filtering_service: EmailFilteringService = Depends(get_email_filtering_service)
):
    """Re-analyze email using AI"""
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        # Prepare email data for analysis
        email_data = {
            'id': email.id,
            'subject': email.subject,
            'sender_email': email.sender_email,
            'body_text': email.body_text
        }
        
        # Re-analyze with AI
        analysis = filtering_service.analyze_email(email_data)
        
        # Update email with new analysis
        email.is_hiring_related = analysis.get('is_hiring_related', False)
        email.confidence_score = str(analysis.get('confidence_score', 0.0))
        email.category = EmailCategory[analysis.get('category', 'OTHER')]
        email.priority = EmailPriority[analysis.get('priority', 'medium').upper()]
        email.company_name = analysis.get('company_name')
        email.job_title = analysis.get('job_title')
        
        if analysis.get('key_details'):
            email.notes = json.dumps(analysis.get('key_details', []))
        
        email.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(email)
        
        return {
            "message": "Email re-analyzed successfully",
            "analysis": analysis,
            "email": email
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to re-analyze email: {str(e)}") 