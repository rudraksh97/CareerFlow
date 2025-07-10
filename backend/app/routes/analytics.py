from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import datetime, timedelta

from ..models.database import get_db
from ..models.application import Application, ApplicationStatus, ApplicationSource
from ..models.contact import Contact, ContactType, Interaction

router = APIRouter()

@router.get("/dashboard/")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get comprehensive dashboard analytics"""
    
    # Application analytics
    total_applications = db.query(Application).count()
    
    # Status breakdown
    status_counts = {}
    for status in ApplicationStatus:
        count = db.query(Application).filter(Application.status == status).count()
        status_counts[status.value] = count
    
    # Source breakdown
    source_counts = {}
    for source in ApplicationSource:
        count = db.query(Application).filter(Application.source == source).count()
        source_counts[source.value] = count
    
    # Recent applications (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_applications = db.query(Application).filter(
        Application.date_applied >= thirty_days_ago
    ).count()
    
    # Success rate (interviews and offers)
    successful = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER])
    ).count()
    success_rate = (successful / total_applications * 100) if total_applications > 0 else 0
    
    # Contact analytics
    total_contacts = db.query(Contact).count()
    
    # Contact type breakdown
    contact_type_counts = {}
    for contact_type in ContactType:
        count = db.query(Contact).filter(Contact.contact_type == contact_type).count()
        contact_type_counts[contact_type.value] = count
    
    # Recent interactions
    recent_interactions = db.query(Interaction).filter(
        Interaction.date >= thirty_days_ago
    ).count()
    
    return {
        "total_applications": total_applications,
        "applications_by_status": status_counts,
        "applications_by_source": source_counts,
        "success_rate": round(success_rate, 2),
        "recent_applications": recent_applications,
        "total_contacts": total_contacts,
        "contacts_by_type": contact_type_counts,
        "recent_interactions": recent_interactions
    }

@router.get("/applications/")
def get_application_analytics(db: Session = Depends(get_db)):
    """Get application-specific analytics"""
    
    # Application analytics
    total_applications = db.query(Application).count()
    
    # Status breakdown
    status_counts = {}
    for status in ApplicationStatus:
        count = db.query(Application).filter(Application.status == status).count()
        status_counts[status.value] = count
    
    # Success rate (interviews and offers)
    successful = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER])
    ).count()
    success_rate = (successful / total_applications * 100) if total_applications > 0 else 0
    
    return {
        "total_applications": total_applications,
        "applications_by_status": status_counts,
        "success_rate": round(success_rate, 2)
    }

@router.get("/contacts/")
def get_contact_analytics(db: Session = Depends(get_db)):
    """Get contact-specific analytics"""
    
    # Contact analytics
    total_contacts = db.query(Contact).count()
    
    # Contact type breakdown
    contact_type_counts = {}
    for contact_type in ContactType:
        count = db.query(Contact).filter(Contact.contact_type == contact_type).count()
        contact_type_counts[contact_type.value] = count
    
    # Recent interactions (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_interactions = db.query(Interaction).filter(
        Interaction.date >= thirty_days_ago
    ).count()
    
    return {
        "total_contacts": total_contacts,
        "contacts_by_type": contact_type_counts,
        "recent_interactions": recent_interactions
    }

@router.get("/performance/")
def get_performance_analytics(db: Session = Depends(get_db)):
    """Get performance metrics analytics"""
    
    total_applications = db.query(Application).count()
    
    if total_applications == 0:
        return {
            "total_applications": 0,
            "interview_rate": 0.0,
            "offer_rate": 0.0,
            "success_rate": 0.0
        }
    
    # Interview rate (applied + interview + offer + rejected that had interviews)
    interviews = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER])
    ).count()
    interview_rate = (interviews / total_applications * 100)
    
    # Offer rate
    offers = db.query(Application).filter(Application.status == ApplicationStatus.OFFER).count()
    offer_rate = (offers / total_applications * 100)
    
    # Success rate (offers)
    success_rate = offer_rate
    
    return {
        "total_applications": total_applications,
        "interview_rate": round(interview_rate, 2),
        "offer_rate": round(offer_rate, 2),
        "success_rate": round(success_rate, 2)
    }

@router.get("/applications/trends")
def get_application_trends(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """Get application trends over time"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily application counts
    daily_counts = db.query(
        func.date(Application.date_applied).label('date'),
        func.count(Application.id).label('count')
    ).filter(
        Application.date_applied >= start_date
    ).group_by(
        func.date(Application.date_applied)
    ).order_by(
        func.date(Application.date_applied)
    ).all()
    
    # Monthly breakdown
    monthly_counts = db.query(
        extract('year', Application.date_applied).label('year'),
        extract('month', Application.date_applied).label('month'),
        func.count(Application.id).label('count')
    ).filter(
        Application.date_applied >= start_date
    ).group_by(
        extract('year', Application.date_applied),
        extract('month', Application.date_applied)
    ).order_by(
        extract('year', Application.date_applied),
        extract('month', Application.date_applied)
    ).all()
    
    return {
        "daily_trends": [{"date": str(date), "count": count} for date, count in daily_counts],
        "monthly_trends": [{"year": year, "month": month, "count": count} for year, month, count in monthly_counts]
    }

@router.get("/applications/source-effectiveness/")
def get_source_effectiveness(db: Session = Depends(get_db)):
    """Analyze effectiveness of different application sources"""
    
    source_analysis = []
    
    for source in ApplicationSource:
        total = db.query(Application).filter(Application.source == source).count()
        
        if total > 0:
            # Calculate success rate for this source
            successful = db.query(Application).filter(
                Application.source == source,
                Application.status.in_([ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER])
            ).count()
            
            success_rate = (successful / total * 100)
            
            # Status breakdown for this source
            status_breakdown = {}
            for status in ApplicationStatus:
                count = db.query(Application).filter(
                    Application.source == source,
                    Application.status == status
                ).count()
                status_breakdown[status.value] = count
            
            source_analysis.append({
                "source": source.value,
                "total_applications": total,
                "success_rate": round(success_rate, 2),
                "status_breakdown": status_breakdown
            })
    
    return {"source_effectiveness": source_analysis}

@router.get("/contacts/network-analysis")
def get_network_analysis(db: Session = Depends(get_db)):
    """Analyze contact network and relationships"""
    
    # Company distribution
    company_counts = db.query(
        Contact.company,
        func.count(Contact.id).label('count')
    ).group_by(Contact.company).order_by(
        func.count(Contact.id).desc()
    ).limit(10).all()
    
    # Most active contacts (by interaction count)
    active_contacts = db.query(
        Contact.name,
        Contact.company,
        func.count(Interaction.id).label('interaction_count')
    ).join(Interaction).group_by(
        Contact.id, Contact.name, Contact.company
    ).order_by(
        func.count(Interaction.id).desc()
    ).limit(10).all()
    
    # Interaction trends
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_interactions = db.query(
        func.date(Interaction.date).label('date'),
        func.count(Interaction.id).label('count')
    ).filter(
        Interaction.date >= thirty_days_ago
    ).group_by(
        func.date(Interaction.date)
    ).order_by(
        func.date(Interaction.date)
    ).all()
    
    return {
        "top_companies": [{"company": company, "count": count} for company, count in company_counts],
        "active_contacts": [{"name": name, "company": company, "interactions": count} for name, company, count in active_contacts],
        "interaction_trends": [{"date": str(date), "count": count} for date, count in recent_interactions]
    }

@router.get("/export/data")
def export_data(
    format: str = Query("json", description="Export format (json, csv)"),
    db: Session = Depends(get_db)
):
    """Export all data for backup or analysis"""
    
    # Get all applications
    applications = db.query(Application).all()
    app_data = []
    for app in applications:
        app_data.append({
            "id": app.id,
            "company_name": app.company_name,
            "job_title": app.job_title,
            "job_id": app.job_id,
            "job_url": app.job_url,
            "portal_url": app.portal_url,
            "status": app.status.value,
            "date_applied": app.date_applied.isoformat(),
            "email_used": app.email_used,
            "resume_filename": app.resume_filename,
            "source": app.source.value,
            "notes": app.notes,
            "created_at": app.created_at.isoformat(),
            "updated_at": app.updated_at.isoformat()
        })
    
    # Get all contacts
    contacts = db.query(Contact).all()
    contact_data = []
    for contact in contacts:
        contact_data.append({
            "id": contact.id,
            "name": contact.name,
            "email": contact.email,
            "company": contact.company,
            "role": contact.role,
            "contact_type": contact.contact_type.value,
            "notes": contact.notes,
            "created_at": contact.created_at.isoformat(),
            "updated_at": contact.updated_at.isoformat()
        })
    
    return {
        "export_date": datetime.utcnow().isoformat(),
        "applications": app_data,
        "contacts": contact_data,
        "total_applications": len(app_data),
        "total_contacts": len(contact_data)
    } 