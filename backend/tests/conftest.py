import pytest
import tempfile
import os
import shutil
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import app
from app.models.database import Base, get_db
from app.models.application import Application, ApplicationStatus, ApplicationSource
from app.models.contact import Contact, ContactType, Interaction
from app.models.profile import Profile
from app.models.setting import Setting
from app.models.referral_message import ReferralMessage, ReferralMessageType
from datetime import datetime, timedelta
import uuid


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override the database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def test_db():
    """Create test database and tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db):
    """Create a new database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create a test client with database session"""
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture
def temp_uploads_dir():
    """Create a temporary uploads directory for file tests"""
    temp_dir = tempfile.mkdtemp()
    uploads_dir = Path(temp_dir) / "uploads"
    uploads_dir.mkdir()
    (uploads_dir / "resumes").mkdir()
    (uploads_dir / "cover_letters").mkdir()
    
    # Store original uploads path
    original_resumes_dir = Path("uploads/resumes")
    original_cover_letters_dir = Path("uploads/cover_letters")
    
    yield uploads_dir
    
    # Cleanup
    shutil.rmtree(temp_dir)


@pytest.fixture
def sample_application_data():
    """Sample application data for testing"""
    return {
        "company_name": "Test Company",
        "job_title": "Software Engineer",
        "job_id": f"test-job-{uuid.uuid4().hex[:8]}",
        "job_url": "https://example.com/job/123",
        "portal_url": "https://example.com/portal",
        "status": ApplicationStatus.APPLIED,
        "date_applied": datetime.utcnow(),
        "email_used": "test@example.com",
        "resume_filename": "test_resume.pdf",
        "resume_file_path": "uploads/resumes/test_resume.pdf",
        "source": ApplicationSource.LINKEDIN,
        "notes": "Test application notes"
    }


@pytest.fixture
def sample_contact_data():
    """Sample contact data for testing"""
    return {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "company": "Test Company",
        "role": "Senior Engineer",
        "linkedin_url": "https://linkedin.com/in/johndoe",
        "contact_type": ContactType.RECRUITER,
        "notes": "Test contact notes"
    }


@pytest.fixture
def sample_referral_message_data():
    """Sample referral message data for testing"""
    return {
        "title": "Cold Outreach Template",
        "message_type": ReferralMessageType.COLD_OUTREACH,
        "subject_template": "Interested in {position_title} at {company_name}",
        "message_template": "Hi {contact_name},\n\nI'm interested in the {position_title} position at {company_name}...",
        "target_company": "Test Company",
        "target_position": "Software Engineer",
        "is_active": True,
        "notes": "Test template notes"
    }


@pytest.fixture
def sample_profile_data():
    """Sample profile data for testing"""
    return {
        "full_name": "Test User",
        "email": "test@example.com",
        "headline": "Software Engineer",
        "linkedin_url": "https://linkedin.com/in/testuser"
    }


@pytest.fixture
def sample_setting_data():
    """Sample setting data for testing"""
    return {
        "key": "test_setting",
        "value": "test_value"
    }


@pytest.fixture
def sample_interaction_data():
    """Sample interaction data for testing"""
    return {
        "interaction_type": "email",
        "notes": "Test interaction notes",
        "date": datetime.utcnow()
    }


@pytest.fixture
def create_test_application(db_session, sample_application_data):
    """Helper function to create a test application"""
    def _create_application(**kwargs):
        data = sample_application_data.copy()
        data.update(kwargs)
        data["id"] = str(uuid.uuid4())
        # Ensure unique job_id by adding timestamp if not provided
        if "job_id" not in kwargs:
            data["job_id"] = f"test-job-{uuid.uuid4().hex[:8]}"
        application = Application(**data)
        db_session.add(application)
        db_session.commit()
        db_session.refresh(application)
        return application
    return _create_application


@pytest.fixture
def create_test_contact(db_session, sample_contact_data):
    """Helper function to create a test contact"""
    def _create_contact(**kwargs):
        data = sample_contact_data.copy()
        data.update(kwargs)
        data["id"] = str(uuid.uuid4())
        contact = Contact(**data)
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)
        return contact
    return _create_contact


@pytest.fixture
def create_test_referral_message(db_session, sample_referral_message_data):
    """Helper function to create a test referral message"""
    def _create_referral_message(**kwargs):
        data = sample_referral_message_data.copy()
        data.update(kwargs)
        data["id"] = str(uuid.uuid4())
        referral_message = ReferralMessage(**data)
        db_session.add(referral_message)
        db_session.commit()
        db_session.refresh(referral_message)
        return referral_message
    return _create_referral_message


@pytest.fixture
def create_test_profile(db_session, sample_profile_data):
    """Helper function to create a test profile"""
    def _create_profile(**kwargs):
        data = sample_profile_data.copy()
        data.update(kwargs)
        profile = Profile(id=1, **data)
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)
        return profile
    return _create_profile


@pytest.fixture
def create_test_setting(db_session, sample_setting_data):
    """Helper function to create a test setting"""
    def _create_setting(**kwargs):
        data = sample_setting_data.copy()
        data.update(kwargs)
        setting = Setting(**data)
        db_session.add(setting)
        db_session.commit()
        db_session.refresh(setting)
        return setting
    return _create_setting


@pytest.fixture
def create_test_interaction(db_session, sample_interaction_data):
    """Helper function to create a test interaction"""
    def _create_interaction(contact_id, **kwargs):
        data = sample_interaction_data.copy()
        data.update(kwargs)
        data["id"] = str(uuid.uuid4())
        data["contact_id"] = contact_id
        interaction = Interaction(**data)
        db_session.add(interaction)
        db_session.commit()
        db_session.refresh(interaction)
        return interaction
    return _create_interaction


@pytest.fixture
def mock_openai_service(monkeypatch):
    """Mock OpenAI service for testing"""
    class MockOpenAIService:
        def __init__(self, api_key):
            self.api_key = api_key
        
        def test_api_key(self):
            return True
        
        def parse_job_url(self, url):
            return {
                "company_name": "Mock Company",
                "job_title": "Mock Position",
                "job_id": "mock-123",
                "job_url": url,
                "portal_url": "https://mock.com/portal"
            }
    
    monkeypatch.setattr("app.services.openai_service.OpenAIService", MockOpenAIService)
    return MockOpenAIService("mock-api-key")


@pytest.fixture
def sample_pdf_file():
    """Create a sample PDF file for testing"""
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_file.write(b"%PDF-1.4\n%Test PDF content\n%%EOF")
    temp_file.close()
    return temp_file.name


@pytest.fixture
def sample_docx_file():
    """Create a sample DOCX file for testing"""
    temp_file = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
    temp_file.write(b"PK\x03\x04\x14\x00\x00\x00\x08\x00Test DOCX content")
    temp_file.close()
    return temp_file.name 