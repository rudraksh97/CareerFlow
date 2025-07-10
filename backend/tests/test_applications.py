import pytest
import os
from datetime import datetime, timedelta
from fastapi import UploadFile
from app.models.application import ApplicationStatus, ApplicationSource


class TestApplicationsAPI:
    """Test suite for applications API endpoints"""

    def test_create_application_success(self, client, sample_pdf_file):
        """Test successful application creation with file upload"""
        with open(sample_pdf_file, "rb") as f:
            files = {
                "resume": ("test_resume.pdf", f, "application/pdf")
            }
            data = {
                "company_name": "Test Company",
                "job_title": "Software Engineer",
                "job_id": "test-job-123",
                "job_url": "https://example.com/job/123",
                "portal_url": "https://example.com/portal",
                "status": ApplicationStatus.APPLIED.value,
                "date_applied": datetime.utcnow().isoformat(),
                "email_used": "test@example.com",
                "source": ApplicationSource.LINKEDIN.value,
                "notes": "Test application notes"
            }
            
            response = client.post("/api/applications/", data=data, files=files)
            
            assert response.status_code == 200
            result = response.json()
            assert result["company_name"] == "Test Company"
            assert result["job_title"] == "Software Engineer"
            assert result["job_id"] == "test-job-123"
            assert result["resume_filename"].endswith(".pdf")
            assert "id" in result
            assert "created_at" in result
            assert "updated_at" in result

    def test_create_application_with_cover_letter(self, client, sample_pdf_file, sample_docx_file):
        """Test application creation with both resume and cover letter"""
        with open(sample_pdf_file, "rb") as resume_f, open(sample_docx_file, "rb") as cover_f:
            files = {
                "resume": ("test_resume.pdf", resume_f, "application/pdf"),
                "cover_letter": ("test_cover.docx", cover_f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            }
            data = {
                "company_name": "Test Company",
                "job_title": "Software Engineer",
                "job_id": "test-job-124",
                "job_url": "https://example.com/job/124",
                "status": ApplicationStatus.APPLIED.value,
                "date_applied": datetime.utcnow().isoformat(),
                "email_used": "test@example.com",
                "source": ApplicationSource.LINKEDIN.value
            }
            
            response = client.post("/api/applications/", data=data, files=files)
            
            assert response.status_code == 200
            result = response.json()
            assert result["cover_letter_filename"].endswith(".docx")

    def test_create_application_invalid_file_type(self, client):
        """Test application creation with invalid file type"""
        # Create a temporary text file
        temp_file = "temp.txt"
        with open(temp_file, "w") as f:
            f.write("This is not a valid resume file")
        
        try:
            with open(temp_file, "rb") as f:
                files = {"resume": ("test_resume.txt", f, "text/plain")}
                data = {
                    "company_name": "Test Company",
                    "job_title": "Software Engineer",
                    "job_id": "test-job-125",
                    "job_url": "https://example.com/job/125",
                    "status": ApplicationStatus.APPLIED.value,
                    "date_applied": datetime.utcnow().isoformat(),
                    "email_used": "test@example.com",
                    "source": ApplicationSource.LINKEDIN.value
                }
                
                response = client.post("/api/applications/", data=data, files=files)
                
                assert response.status_code == 400
                assert "Invalid file type" in response.json()["detail"]
        finally:
            os.remove(temp_file)

    def test_create_application_missing_required_fields(self, client, sample_pdf_file):
        """Test application creation with missing required fields"""
        with open(sample_pdf_file, "rb") as f:
            files = {"resume": ("test_resume.pdf", f, "application/pdf")}
            data = {
                "company_name": "Test Company",
                # Missing job_title, job_id, etc.
            }
            
            response = client.post("/api/applications/", data=data, files=files)
            
            assert response.status_code == 422  # Validation error

    def test_get_applications_list(self, client, create_test_application):
        """Test getting list of applications"""
        # Create test applications
        app1 = create_test_application(
            company_name="Company A",
            job_title="Engineer A",
            job_id="job-a-1"
        )
        app2 = create_test_application(
            company_name="Company B", 
            job_title="Engineer B",
            job_id="job-b-1"
        )
        
        response = client.get("/api/applications/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        assert any(app["id"] == app1.id for app in result)
        assert any(app["id"] == app2.id for app in result)

    def test_get_applications_with_filters(self, client, create_test_application):
        """Test getting applications with filters"""
        # Create test applications with different statuses
        app1 = create_test_application(
            company_name="Company A",
            status=ApplicationStatus.APPLIED,
            source=ApplicationSource.LINKEDIN
        )
        app2 = create_test_application(
            company_name="Company B",
            status=ApplicationStatus.INTERVIEW,
            source=ApplicationSource.INDEED
        )
        
        # Test company filter
        response = client.get("/api/applications/?company_name=Company A")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["company_name"] == "Company A"
        
        # Test status filter
        response = client.get(f"/api/applications/?status={ApplicationStatus.INTERVIEW.value}")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["status"] == ApplicationStatus.INTERVIEW.value
        
        # Test source filter
        response = client.get(f"/api/applications/?source={ApplicationSource.LINKEDIN.value}")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["source"] == ApplicationSource.LINKEDIN.value

    def test_get_application_by_id(self, client, create_test_application):
        """Test getting a specific application by ID"""
        app = create_test_application()
        
        response = client.get(f"/api/applications/{app.id}/")
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == app.id
        assert result["company_name"] == app.company_name

    def test_get_application_by_id_not_found(self, client):
        """Test getting non-existent application"""
        response = client.get("/api/applications/non-existent-id/")
        
        assert response.status_code == 404
        assert "Application not found" in response.json()["detail"]

    def test_get_recent_applications(self, client, create_test_application):
        """Test getting recent applications"""
        # Create multiple applications
        for i in range(7):
            create_test_application(
                company_name=f"Company {i}",
                job_id=f"job-{i}"
            )
        
        response = client.get("/api/applications/recent/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 5  # Should return only 5 most recent

    def test_update_application(self, client, create_test_application):
        """Test updating an application"""
        app = create_test_application()
        
        update_data = {
            "status": ApplicationStatus.INTERVIEW.value,
            "notes": "Updated notes"
        }
        
        response = client.put(f"/api/applications/{app.id}", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == ApplicationStatus.INTERVIEW.value
        assert result["notes"] == "Updated notes"

    def test_update_application_not_found(self, client):
        """Test updating non-existent application"""
        update_data = {"status": ApplicationStatus.INTERVIEW.value}
        
        response = client.put("/api/applications/non-existent-id", json=update_data)
        
        assert response.status_code == 404
        assert "Application not found" in response.json()["detail"]

    def test_delete_application(self, client, create_test_application):
        """Test deleting an application"""
        app = create_test_application()
        
        response = client.delete(f"/api/applications/{app.id}")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Application deleted successfully"
        
        # Verify it's deleted
        get_response = client.get(f"/api/applications/{app.id}/")
        assert get_response.status_code == 404

    def test_delete_application_not_found(self, client):
        """Test deleting non-existent application"""
        response = client.delete("/api/applications/non-existent-id")
        
        assert response.status_code == 404
        assert "Application not found" in response.json()["detail"]

    def test_download_resume(self, client, create_test_application, sample_pdf_file):
        """Test downloading resume file"""
        # Create application with actual file
        app = create_test_application()
        
        # Mock the file path to point to our test file
        app.resume_file_path = sample_pdf_file
        app.resume_filename = "test_resume.pdf"
        
        response = client.get(f"/api/applications/{app.id}/resume")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
        assert "test_resume.pdf" in response.headers["content-disposition"]

    def test_download_resume_not_found(self, client, create_test_application):
        """Test downloading resume for non-existent application"""
        response = client.get("/api/applications/non-existent-id/resume")
        
        assert response.status_code == 404
        assert "Application not found" in response.json()["detail"]

    def test_download_resume_file_not_found(self, client, create_test_application):
        """Test downloading resume when file doesn't exist"""
        app = create_test_application()
        app.resume_file_path = "non/existent/path.pdf"
        
        response = client.get(f"/api/applications/{app.id}/resume")
        
        assert response.status_code == 404
        assert "Resume file not found" in response.json()["detail"]

    def test_download_cover_letter(self, client, create_test_application, sample_docx_file):
        """Test downloading cover letter file"""
        app = create_test_application()
        app.cover_letter_file_path = sample_docx_file
        app.cover_letter_filename = "test_cover.docx"
        
        response = client.get(f"/api/applications/{app.id}/cover-letter")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
        assert "test_cover.docx" in response.headers["content-disposition"]

    def test_parse_job_url_success(self, client, create_test_setting, monkeypatch):
        """Test successful job URL parsing with mock OpenAI service"""
        # Set a dummy API key
        create_test_setting(key="openai_api_key", value="test-api-key")

        class MockSuccessfulOpenAIService:
            def __init__(self, api_key):
                pass
            def test_api_key(self):
                return True
            def parse_job_url(self, url):
                return {"company_name": "Mock Company", "job_title": "Mock Job"}

        monkeypatch.setattr("app.routes.applications.OpenAIService", MockSuccessfulOpenAIService)

        response = client.post("/api/applications/parse-url/", data={"url": "https://example.com/job/123"})
        
        assert response.status_code == 200
        result = response.json()
        assert result["company_name"] == "Mock Company"
        assert result["job_title"] == "Mock Job"

    def test_parse_job_url_no_api_key(self, client):
        """Test job URL parsing with no API key"""
        response = client.post("/api/applications/parse-url/", data={"url": "https://example.com/job/123"})
        
        assert response.status_code == 400
        assert "OpenAI API key not configured" in response.json()["detail"]

    def test_parse_job_url_invalid_api_key(self, client, create_test_setting, monkeypatch):
        """Test parsing job URL with invalid API key"""
        create_test_setting(key="openai_api_key", value="invalid-key")

        class MockInvalidOpenAIService:
            def __init__(self, api_key):
                pass
            
            def test_api_key(self):
                return False

        monkeypatch.setattr("app.routes.applications.OpenAIService", MockInvalidOpenAIService)
        
        response = client.post("/api/applications/parse-url/", data={"url": "https://example.com/job/123"})
        
        assert response.status_code == 400
        assert "Invalid OpenAI API key" in response.json()["detail"]

    def test_parse_job_url_parsing_failure(self, client, create_test_setting, monkeypatch):
        """Test parsing job URL when parsing fails"""
        create_test_setting(key="openai_api_key", value="test-key")

        class MockFailedOpenAIService:
            def __init__(self, api_key):
                pass
            
            def test_api_key(self):
                return True
            
            def parse_job_url(self, url):
                return None

        monkeypatch.setattr("app.routes.applications.OpenAIService", MockFailedOpenAIService)
        
        response = client.post("/api/applications/parse-url/", data={"url": "https://example.com/job/123"})
        
        assert response.status_code == 400
        assert "Unable to extract job details" in response.json()["detail"]

    def test_pagination(self, client, create_test_application):
        """Test pagination of applications"""
        # Create 12 applications
        for i in range(15):
            create_test_application(
                company_name=f"Company {i}",
                job_id=f"job-{i}"
            )
        
        # Test first page (default limit is 100)
        response = client.get("/api/applications/?skip=0&limit=10")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 10
        
        # Test second page
        response = client.get("/api/applications/?skip=10&limit=10")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 5  # Only 5 remaining

    def test_pagination_invalid_params(self, client):
        """Test pagination with invalid parameters"""
        # Negative skip
        response = client.get("/api/applications/?skip=-1")
        assert response.status_code == 422
        
        # Zero limit
        response = client.get("/api/applications/?limit=0")
        assert response.status_code == 422
        
        # Too large limit
        response = client.get("/api/applications/?limit=1001")
        assert response.status_code == 422 