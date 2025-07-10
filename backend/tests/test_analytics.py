
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.application import Application, ApplicationStatus, ApplicationSource
from app.models.contact import Contact, ContactType, Interaction

# Helper function to create applications
def create_applications(db: Session):
    apps = [
        Application(id="1", company_name="Tech Corp", job_title="Engineer", job_id="tce", job_url="http://example.com", date_applied=datetime(2023, 1, 15), status=ApplicationStatus.APPLIED, source=ApplicationSource.LINKEDIN, email_used="test@test.com", resume_filename="a.pdf", resume_file_path="a.pdf"),
        Application(id="2", company_name="Tech Corp", job_title="Senior Engineer", job_id="tcs", job_url="http://example.com", date_applied=datetime(2023, 1, 20), status=ApplicationStatus.INTERVIEW, source=ApplicationSource.LINKEDIN, email_used="test@test.com", resume_filename="a.pdf", resume_file_path="a.pdf"),
        Application(id="3", company_name="Data Inc", job_title="Analyst", job_id="dia", job_url="http://example.com", date_applied=datetime(2023, 2, 10), status=ApplicationStatus.OFFER, source=ApplicationSource.INDEED, email_used="test@test.com", resume_filename="a.pdf", resume_file_path="a.pdf"),
        Application(id="4", company_name="Web LLC", job_title="Developer", job_id="wld", job_url="http://example.com", date_applied=datetime.utcnow() - timedelta(days=10), status=ApplicationStatus.REJECTED, source=ApplicationSource.COMPANY_WEBSITE, email_used="test@test.com", resume_filename="a.pdf", resume_file_path="a.pdf"),
        Application(id="5", company_name="Web LLC", job_title="Frontend Dev", job_id="wfd", job_url="http://example.com", date_applied=datetime.utcnow() - timedelta(days=5), status=ApplicationStatus.APPLIED, source=ApplicationSource.COMPANY_WEBSITE, email_used="test@test.com", resume_filename="a.pdf", resume_file_path="a.pdf"),
    ]
    db.add_all(apps)
    db.commit()
    return apps

# Helper function to create contacts and interactions
def create_contacts_and_interactions(db: Session):
    contacts = [
        Contact(id="1", name="John Doe", email="john@techcorp.com", company="Tech Corp", contact_type=ContactType.RECRUITER),
        Contact(id="2", name="Jane Smith", email="jane@data-inc.com", company="Data Inc", contact_type=ContactType.HIRING_MANAGER),
        Contact(id="3", name="Sam Brown", email="sam@webllc.com", company="Web LLC", contact_type=ContactType.REFERRAL),
        Contact(id="4", name="Peter Jones", email="peter@techcorp.com", company="Tech Corp", contact_type=ContactType.OTHER),
    ]
    db.add_all(contacts)
    db.commit()

    interactions = [
        Interaction(id="1", contact_id="1", date=datetime.utcnow() - timedelta(days=15), interaction_type="email"),
        Interaction(id="2", contact_id="2", date=datetime.utcnow() - timedelta(days=10), interaction_type="call"),
        Interaction(id="3", contact_id="1", date=datetime.utcnow() - timedelta(days=5), interaction_type="meeting"),
    ]
    db.add_all(interactions)
    db.commit()
    return contacts, interactions

class TestAnalyticsAPI:
    def test_get_dashboard_analytics_empty(self, client: TestClient):
        response = client.get("/api/analytics/dashboard/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_applications"] == 0
        assert data["total_contacts"] == 0
        assert data["success_rate"] == 0.0

    def test_get_dashboard_analytics_with_data(self, client: TestClient, db_session: Session):
        create_applications(db_session)
        create_contacts_and_interactions(db_session)
        
        response = client.get("/api/analytics/dashboard/")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_applications"] == 5
        assert data["total_contacts"] == 4
        assert data["success_rate"] == 40.0  # (2/5 * 100) -> interview and offer
        assert data["recent_applications"] == 2
        assert data["recent_interactions"] == 3
        assert data["applications_by_status"][ApplicationStatus.APPLIED.value] == 2
        assert data["contacts_by_type"][ContactType.RECRUITER.value] == 1

    def test_get_application_trends(self, client: TestClient, db_session: Session):
        create_applications(db_session)
        response = client.get("/api/analytics/applications/trends?days=365")
        assert response.status_code == 200
        data = response.json()
        assert len(data["daily_trends"]) > 0
        assert len(data["monthly_trends"]) > 0
        assert data["daily_trends"][0]["count"] > 0

    def test_get_source_effectiveness(self, client: TestClient, db_session: Session):
        create_applications(db_session)
        response = client.get("/api/analytics/applications/source-effectiveness/")
        assert response.status_code == 200
        data = response.json()["source_effectiveness"]
        
        linkedin_source = next((s for s in data if s["source"] == "linkedin"), None)
        assert linkedin_source is not None
        assert linkedin_source["total_applications"] == 2
        assert linkedin_source["success_rate"] == 50.0

    def test_get_network_analysis(self, client: TestClient, db_session: Session):
        create_contacts_and_interactions(db_session)
        response = client.get("/api/analytics/contacts/network-analysis")
        assert response.status_code == 200
        data = response.json()
        assert len(data["top_companies"]) > 0
        assert data["top_companies"][0]["company"] == "Tech Corp"
        assert len(data["active_contacts"]) > 0
        assert data["active_contacts"][0]["name"] == "John Doe"
        assert data["active_contacts"][0]["interactions"] == 2

    def test_export_data(self, client: TestClient, db_session: Session):
        create_applications(db_session)
        create_contacts_and_interactions(db_session)
        
        response = client.get("/api/analytics/export/data?format=json")
        assert response.status_code == 200
        data = response.json()
        assert data["total_applications"] == 5
        assert data["total_contacts"] == 4
        assert len(data["applications"]) == 5
        assert len(data["contacts"]) == 4

    def test_export_data_csv_not_implemented(self, client: TestClient):
        response = client.get("/api/analytics/export/data?format=csv")
        # Assuming CSV is not implemented and it returns JSON
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]

    def test_export_data_invalid_format(self, client: TestClient):
        # Assuming the endpoint just defaults to JSON for invalid formats
        response = client.get("/api/analytics/export/data?format=invalid")
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"] 