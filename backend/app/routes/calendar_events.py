from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional
from datetime import datetime, timedelta
import json

from ..models.database import get_db
from ..models.calendar_event import CalendarEvent, EventStatus, EventType
from ..models.setting import Setting as SettingModel
from ..services.google_api_service import GoogleAPIService
from ..services.email_filtering_service import EmailFilteringService  # For AI analysis
from ..services.openai_service import OpenAIService
from ..schemas import CalendarEventSchema, CalendarEventCreate, CalendarEventUpdate

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

def get_ai_service(db: Session = Depends(get_db)) -> OpenAIService:
    """Get OpenAI service for event analysis"""
    try:
        api_key_setting = db.query(SettingModel).filter(SettingModel.key == "openai_api_key").first()
        if not api_key_setting or not api_key_setting.value:
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")
        
        return OpenAIService(api_key_setting.value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize AI service: {str(e)}")

@router.get("/", response_model=List[CalendarEventSchema])
async def get_calendar_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[EventStatus] = None,
    event_type: Optional[EventType] = None,
    is_hiring_related: Optional[bool] = None,
    organizer_email: Optional[str] = None,
    company_name: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    upcoming_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get calendar events with filtering options"""
    
    query = db.query(CalendarEvent)
    
    # Apply filters
    if status:
        query = query.filter(CalendarEvent.status == status)
    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)
    if is_hiring_related is not None:
        query = query.filter(CalendarEvent.is_hiring_related == is_hiring_related)
    if organizer_email:
        query = query.filter(CalendarEvent.organizer_email.ilike(f"%{organizer_email}%"))
    if company_name:
        query = query.filter(CalendarEvent.company_name.ilike(f"%{company_name}%"))
    if search:
        search_filter = or_(
            CalendarEvent.summary.ilike(f"%{search}%"),
            CalendarEvent.description.ilike(f"%{search}%"),
            CalendarEvent.location.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    if date_from:
        query = query.filter(CalendarEvent.start_datetime >= date_from)
    if date_to:
        query = query.filter(CalendarEvent.start_datetime <= date_to)
    if upcoming_only:
        query = query.filter(CalendarEvent.start_datetime >= datetime.utcnow())
    
    # Order by start time
    if upcoming_only:
        query = query.order_by(asc(CalendarEvent.start_datetime))
    else:
        query = query.order_by(desc(CalendarEvent.start_datetime))
    
    # Apply pagination
    events = query.offset(skip).limit(limit).all()
    return events

@router.get("/upcoming", response_model=List[CalendarEventSchema])
async def get_upcoming_events(
    days_ahead: int = Query(7, ge=1, le=30),
    hiring_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get upcoming calendar events"""
    
    now = datetime.utcnow()
    end_date = now + timedelta(days=days_ahead)
    
    query = db.query(CalendarEvent).filter(
        CalendarEvent.start_datetime >= now,
        CalendarEvent.start_datetime <= end_date,
        CalendarEvent.status != EventStatus.CANCELLED
    )
    
    if hiring_only:
        query = query.filter(CalendarEvent.is_hiring_related == True)
    
    events = query.order_by(asc(CalendarEvent.start_datetime)).all()
    return events

@router.get("/{event_id}", response_model=CalendarEventSchema)
async def get_calendar_event(event_id: str, db: Session = Depends(get_db)):
    """Get specific calendar event by ID"""
    
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    return event

@router.post("/sync")
async def sync_calendar_events(
    background_tasks: BackgroundTasks,
    days_ahead: int = Query(30, ge=1, le=90),
    calendar_ids: Optional[List[str]] = None,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
    google_service: GoogleAPIService = Depends(get_google_service)
):
    """Sync calendar events from Google Calendar"""
    
    try:
        # Get available calendars if none specified
        if not calendar_ids:
            calendars = google_service.get_calendars()
            calendar_ids = [cal['id'] for cal in calendars if cal.get('selected', True)]
        
        # Add background task for calendar syncing
        background_tasks.add_task(
            sync_calendar_events_background,
            db, google_service, calendar_ids, days_ahead, force_refresh
        )
        
        return {
            "message": "Calendar sync started",
            "calendar_ids": calendar_ids,
            "days_ahead": days_ahead
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start calendar sync: {str(e)}")

async def sync_calendar_events_background(
    db: Session,
    google_service: GoogleAPIService,
    calendar_ids: List[str],
    days_ahead: int,
    force_refresh: bool
):
    """Background task to sync calendar events from Google Calendar"""
    
    try:
        print(f"[INFO] Starting calendar sync for {len(calendar_ids)} calendars, {days_ahead} days ahead")
        
        synced_count = 0
        updated_count = 0
        
        for calendar_id in calendar_ids:
            try:
                # Get events from Google Calendar
                events_from_google = google_service.get_upcoming_events(days_ahead)
                
                print(f"[INFO] Found {len(events_from_google)} events from calendar {calendar_id}")
                
                for google_event in events_from_google:
                    try:
                        # Check if event already exists
                        existing_event = db.query(CalendarEvent).filter(CalendarEvent.id == google_event['id']).first()
                        
                        if existing_event and not force_refresh:
                            continue  # Skip existing events unless force refresh
                        
                        # Analyze event for hiring relevance
                        analysis = await analyze_event_for_hiring(google_event, db)
                        
                        # Prepare event data
                        event_data = {
                            'id': google_event['id'],
                            'calendar_id': google_event['calendar_id'],
                            'summary': google_event['summary'],
                            'description': google_event.get('description', ''),
                            'location': google_event.get('location', ''),
                            'start_datetime': google_event['start_datetime'],
                            'end_datetime': google_event['end_datetime'],
                            'timezone': google_event.get('timezone'),
                            'is_all_day': google_event['is_all_day'],
                            'status': EventStatus[google_event['status']],
                            'event_type': EventType[analysis.get('event_type', 'OTHER')],
                            'is_hiring_related': analysis.get('is_hiring_related', False),
                            'confidence_score': str(analysis.get('confidence_score', 0.0)),
                            'organizer_email': google_event.get('organizer_email', ''),
                            'organizer_name': google_event.get('organizer_name', ''),
                            'attendees': json.dumps(google_event.get('attendees', [])),
                            'meeting_link': google_event.get('meeting_link'),
                            'company_name': analysis.get('company_name'),
                            'job_title': analysis.get('job_title'),
                            'interview_round': analysis.get('interview_round'),
                            'notes': json.dumps(analysis.get('key_details', [])),
                            'is_synced': True,
                            'last_sync_at': datetime.utcnow()
                        }
                        
                        if existing_event:
                            # Update existing event
                            for key, value in event_data.items():
                                if key != 'id':  # Don't update the ID
                                    setattr(existing_event, key, value)
                            updated_count += 1
                        else:
                            # Create new event
                            new_event = CalendarEvent(**event_data)
                            db.add(new_event)
                            synced_count += 1
                        
                        # Commit every 10 events to avoid large transactions
                        if (synced_count + updated_count) % 10 == 0:
                            db.commit()
                            
                    except Exception as e:
                        print(f"[ERROR] Failed to sync event {google_event.get('id', 'unknown')}: {str(e)}")
                        continue
                        
            except Exception as e:
                print(f"[ERROR] Failed to sync calendar {calendar_id}: {str(e)}")
                continue
        
        # Final commit
        db.commit()
        
        print(f"[INFO] Calendar sync completed: {synced_count} new, {updated_count} updated")
        
    except Exception as e:
        print(f"[ERROR] Calendar sync failed: {str(e)}")
        db.rollback()

async def analyze_event_for_hiring(event_data: dict, db: Session) -> dict:
    """Analyze calendar event to determine if it's hiring-related"""
    
    try:
        # Get AI service
        api_key_setting = db.query(SettingModel).filter(SettingModel.key == "openai_api_key").first()
        if not api_key_setting or not api_key_setting.value:
            return default_event_analysis()
        
        openai_service = OpenAIService(api_key_setting.value)
        
        summary = event_data.get('summary', '')
        description = event_data.get('description', '')
        organizer_email = event_data.get('organizer_email', '')
        attendees = event_data.get('attendees', [])
        
        # Build attendee list for analysis
        attendee_emails = [att.get('email', '') for att in attendees if att.get('email')]
        
        prompt = f"""
        Analyze this calendar event to determine if it's related to job hiring/recruitment and extract relevant information.
        Return ONLY a valid JSON object with the following structure:

        {{
            "is_hiring_related": true/false,
            "confidence_score": 0.0-1.0,
            "event_type": "interview|meeting|call|deadline|networking|conference|other",
            "company_name": "extracted company name or null",
            "job_title": "extracted job title/position or null",
            "interview_round": "extracted interview round (e.g., 'Technical', 'Final') or null",
            "key_details": ["list", "of", "key", "points"]
        }}

        Event details:
        Title: {summary}
        Description: {description}
        Organizer: {organizer_email}
        Attendees: {', '.join(attendee_emails)}
        """
        
        response = openai_service.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert calendar event analyzer specializing in identifying hiring-related meetings. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )
        
        result_text = response.choices[0].message.content.strip()
        
        try:
            analysis = json.loads(result_text)
            
            # Validate and normalize
            analysis['confidence_score'] = max(0.0, min(1.0, float(analysis.get('confidence_score', 0.5))))
            
            # Map event types
            event_type_mapping = {
                'interview': 'INTERVIEW',
                'meeting': 'MEETING',
                'call': 'CALL',
                'deadline': 'DEADLINE',
                'networking': 'NETWORKING',
                'conference': 'CONFERENCE',
                'other': 'OTHER'
            }
            analysis['event_type'] = event_type_mapping.get(analysis.get('event_type', 'other'), 'OTHER')
            
            return analysis
            
        except json.JSONDecodeError:
            print(f"[ERROR] Failed to parse AI response for event analysis")
            return default_event_analysis()
            
    except Exception as e:
        print(f"[ERROR] Event analysis failed: {str(e)}")
        return default_event_analysis()

def default_event_analysis() -> dict:
    """Return default event analysis when AI analysis fails"""
    return {
        'is_hiring_related': False,
        'confidence_score': 0.0,
        'event_type': 'OTHER',
        'company_name': None,
        'job_title': None,
        'interview_round': None,
        'key_details': []
    }

@router.put("/{event_id}")
async def update_calendar_event(
    event_id: str,
    event_update: CalendarEventUpdate,
    db: Session = Depends(get_db)
):
    """Update calendar event details"""
    
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    try:
        # Update fields
        update_data = event_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(event, field, value)
        
        event.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(event)
        
        return event
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update calendar event: {str(e)}")

@router.delete("/{event_id}")
async def delete_calendar_event(event_id: str, db: Session = Depends(get_db)):
    """Delete calendar event from database (does not delete from Google Calendar)"""
    
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    try:
        db.delete(event)
        db.commit()
        
        return {"message": "Calendar event deleted from database"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete calendar event: {str(e)}")

@router.get("/analytics/stats")
async def get_calendar_analytics(
    days_back: int = Query(30, ge=1, le=365),
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get calendar analytics and statistics"""
    
    try:
        now = datetime.utcnow()
        date_from = now - timedelta(days=days_back)
        date_to = now + timedelta(days=days_ahead)
        
        # Get events from the specified time period
        events = db.query(CalendarEvent).filter(
            CalendarEvent.start_datetime >= date_from,
            CalendarEvent.start_datetime <= date_to
        ).all()
        
        total_events = len(events)
        hiring_events = [e for e in events if e.is_hiring_related]
        upcoming_events = [e for e in events if e.start_datetime >= now]
        past_events = [e for e in events if e.start_datetime < now]
        
        # Event type breakdown
        event_types = {}
        for event in hiring_events:
            event_type = event.event_type.value if event.event_type else 'unknown'
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        # Status breakdown
        status_breakdown = {}
        for event in events:
            status = event.status.value if event.status else 'unknown'
            status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        # Upcoming hiring events by day
        upcoming_hiring_by_day = {}
        for event in upcoming_events:
            if event.is_hiring_related:
                day_key = event.start_datetime.date().isoformat()
                upcoming_hiring_by_day[day_key] = upcoming_hiring_by_day.get(day_key, 0) + 1
        
        return {
            'total_events': total_events,
            'hiring_events': len(hiring_events),
            'hiring_percentage': (len(hiring_events) / total_events * 100) if total_events > 0 else 0,
            'upcoming_events': len(upcoming_events),
            'past_events': len(past_events),
            'event_types': event_types,
            'status_breakdown': status_breakdown,
            'upcoming_hiring_by_day': upcoming_hiring_by_day,
            'date_range': {
                'from': date_from.isoformat(),
                'to': date_to.isoformat(),
                'current': now.isoformat()
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendar analytics: {str(e)}")

@router.post("/test-connection")
async def test_calendar_connection(google_service: GoogleAPIService = Depends(get_google_service)):
    """Test Google Calendar API connection"""
    
    try:
        connection_status = google_service.test_connection()
        calendars = google_service.get_calendars() if connection_status.get('calendar') else []
        
        return {
            "calendar_connected": connection_status.get('calendar', False),
            "calendars_found": len(calendars),
            "calendars": calendars,
            "message": "Calendar connection successful" if connection_status.get('calendar') else "Calendar connection failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

@router.post("/reanalyze/{event_id}")
async def reanalyze_calendar_event(
    event_id: str,
    db: Session = Depends(get_db)
):
    """Re-analyze calendar event using AI"""
    
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    try:
        # Prepare event data for analysis
        event_data = {
            'id': event.id,
            'summary': event.summary,
            'description': event.description,
            'organizer_email': event.organizer_email,
            'attendees': json.loads(event.attendees) if event.attendees else []
        }
        
        # Re-analyze with AI
        analysis = await analyze_event_for_hiring(event_data, db)
        
        # Update event with new analysis
        event.is_hiring_related = analysis.get('is_hiring_related', False)
        event.confidence_score = str(analysis.get('confidence_score', 0.0))
        event.event_type = EventType[analysis.get('event_type', 'OTHER')]
        event.company_name = analysis.get('company_name')
        event.job_title = analysis.get('job_title')
        event.interview_round = analysis.get('interview_round')
        
        if analysis.get('key_details'):
            event.notes = json.dumps(analysis.get('key_details', []))
        
        event.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(event)
        
        return {
            "message": "Calendar event re-analyzed successfully",
            "analysis": analysis,
            "event": event
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to re-analyze calendar event: {str(e)}") 