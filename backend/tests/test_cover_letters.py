import pytest
from datetime import datetime
from app.models.application import ApplicationStatus, ApplicationSource


class TestCoverLettersAPI:
    """Test suite for cover letters API endpoints"""

    def test_get_all_cover_letters_empty(self, client):
        """Test getting cover letters when no applications with cover letters exist"""
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 0

    def test_get_all_cover_letters_with_data(self, client, create_test_application):
        """Test getting cover letters with applications that have cover letters"""
        # Create applications with cover letters
        app1 = create_test_application(
            company_name="Company A",
            job_title="Engineer A",
            cover_letter_filename="cover_a.pdf"
        )
        app2 = create_test_application(
            company_name="Company B",
            job_title="Engineer B",
            cover_letter_filename="cover_b.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # Check that applications are ordered by date_applied desc
        assert result[0]["company_name"] in ["Company A", "Company B"]
        assert result[1]["company_name"] in ["Company A", "Company B"]
        assert result[0]["id"] != result[1]["id"]

    def test_get_all_cover_letters_only_with_cover_letters(self, client, create_test_application):
        """Test that only applications with cover letters are returned"""
        # Create applications with cover letters
        app1 = create_test_application(
            company_name="With Cover Letter",
            cover_letter_filename="cover1.pdf",
            cover_letter_file_path="uploads/cover_letters/cover1.pdf"
        )
        app2 = create_test_application(
            company_name="With Another Cover Letter",
            cover_letter_filename="cover2.pdf",
            cover_letter_file_path="uploads/cover_letters/cover2.pdf"
        )
        
        # Create application without cover letter
        app3 = create_test_application(
            company_name="Without Cover Letter",
            cover_letter_filename=None,
            cover_letter_file_path=None
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2  # Only applications with cover letters
        
        # Check that only applications with cover letters are returned
        companies = [app["company_name"] for app in result]
        assert "With Cover Letter" in companies
        assert "With Another Cover Letter" in companies
        assert "Without Cover Letter" not in companies

    def test_get_all_cover_letters_ordering(self, client, create_test_application):
        """Test that cover letters are ordered by date_applied desc"""
        from datetime import timedelta
        
        now = datetime.utcnow()
        
        # Create applications with different dates
        app1 = create_test_application(
            company_name="Old Company",
            job_title="Old Job",
            date_applied=now - timedelta(days=10),
            cover_letter_filename="old_cover.pdf"
        )
        app2 = create_test_application(
            company_name="New Company",
            job_title="New Job",
            date_applied=now,
            cover_letter_filename="new_cover.pdf"
        )
        app3 = create_test_application(
            company_name="Middle Company",
            job_title="Middle Job",
            date_applied=now - timedelta(days=5),
            cover_letter_filename="middle_cover.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 3
        
        # Should be ordered by date_applied desc (newest first)
        assert result[0]["company_name"] == "New Company"
        assert result[1]["company_name"] == "Middle Company"
        assert result[2]["company_name"] == "Old Company"

    def test_get_all_cover_letters_includes_all_fields(self, client, create_test_application):
        """Test that cover letters endpoint returns all application fields"""
        app = create_test_application(
            company_name="Test Company",
            job_title="Test Job",
            job_id="test-123",
            job_url="https://example.com/job/123",
            portal_url="https://example.com/portal",
            status=ApplicationStatus.APPLIED,
            date_applied=datetime.utcnow(),
            email_used="test@example.com",
            resume_filename="test_resume.pdf",
            resume_file_path="uploads/resumes/test_resume.pdf",
            cover_letter_filename="test_cover.pdf",
            cover_letter_file_path="uploads/cover_letters/test_cover.pdf",
            source=ApplicationSource.LINKEDIN,
            notes="Test notes"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        
        cover_letter_data = result[0]
        assert cover_letter_data["id"] == app.id
        assert cover_letter_data["company_name"] == "Test Company"
        assert cover_letter_data["job_title"] == "Test Job"
        assert cover_letter_data["job_id"] == "test-123"
        assert cover_letter_data["job_url"] == "https://example.com/job/123"
        assert cover_letter_data["portal_url"] == "https://example.com/portal"
        assert cover_letter_data["status"] == ApplicationStatus.APPLIED.value
        assert cover_letter_data["email_used"] == "test@example.com"
        assert cover_letter_data["resume_filename"] == "test_resume.pdf"
        assert cover_letter_data["resume_file_path"] == "uploads/resumes/test_resume.pdf"
        assert cover_letter_data["cover_letter_filename"] == "test_cover.pdf"
        assert cover_letter_data["cover_letter_file_path"] == "uploads/cover_letters/test_cover.pdf"
        assert cover_letter_data["source"] == ApplicationSource.LINKEDIN.value
        assert cover_letter_data["notes"] == "Test notes"
        assert "created_at" in cover_letter_data
        assert "updated_at" in cover_letter_data

    def test_get_all_cover_letters_with_different_statuses(self, client, create_test_application):
        """Test getting cover letters with applications in different statuses"""
        # Create applications with different statuses
        app1 = create_test_application(
            company_name="Applied Company",
            status=ApplicationStatus.APPLIED,
            cover_letter_filename="cover1.pdf"
        )
        app2 = create_test_application(
            company_name="Interview Company",
            status=ApplicationStatus.INTERVIEW,
            cover_letter_filename="cover2.pdf"
        )
        app3 = create_test_application(
            company_name="Offer Company",
            status=ApplicationStatus.OFFER,
            cover_letter_filename="cover3.pdf"
        )
        app4 = create_test_application(
            company_name="Rejected Company",
            status=ApplicationStatus.REJECTED,
            cover_letter_filename="cover4.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 4
        
        # All applications should be returned regardless of status
        companies = [app["company_name"] for app in result]
        assert "Applied Company" in companies
        assert "Interview Company" in companies
        assert "Offer Company" in companies
        assert "Rejected Company" in companies

    def test_get_all_cover_letters_with_different_sources(self, client, create_test_application):
        """Test getting cover letters with applications from different sources"""
        # Create applications from different sources
        app1 = create_test_application(
            company_name="LinkedIn Company",
            source=ApplicationSource.LINKEDIN,
            cover_letter_filename="cover1.pdf"
        )
        app2 = create_test_application(
            company_name="Indeed Company",
            source=ApplicationSource.INDEED,
            cover_letter_filename="cover2.pdf"
        )
        app3 = create_test_application(
            company_name="Company Website",
            source=ApplicationSource.COMPANY_WEBSITE,
            cover_letter_filename="cover3.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 3
        
        # All applications should be returned regardless of source
        companies = [app["company_name"] for app in result]
        assert "LinkedIn Company" in companies
        assert "Indeed Company" in companies
        assert "Company Website" in companies

    def test_get_all_cover_letters_with_different_file_types(self, client, create_test_application):
        """Test getting cover letters with different file types"""
        # Create applications with different cover letter file types
        app1 = create_test_application(
            company_name="PDF Company",
            cover_letter_filename="cover.pdf",
            cover_letter_file_path="uploads/cover_letters/cover.pdf"
        )
        app2 = create_test_application(
            company_name="DOCX Company",
            cover_letter_filename="cover.docx",
            cover_letter_file_path="uploads/cover_letters/cover.docx"
        )
        app3 = create_test_application(
            company_name="DOC Company",
            cover_letter_filename="cover.doc",
            cover_letter_file_path="uploads/cover_letters/cover.doc"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 3
        
        # All applications should be returned with their respective file types
        filenames = [app["cover_letter_filename"] for app in result]
        assert "cover.pdf" in filenames
        assert "cover.docx" in filenames
        assert "cover.doc" in filenames

    def test_get_all_cover_letters_with_different_paths(self, client, create_test_application):
        """Test getting cover letters with different file paths"""
        # Create applications with different cover letter file paths
        app1 = create_test_application(
            company_name="Company A",
            cover_letter_filename="company_a_cover.pdf",
            cover_letter_file_path="uploads/cover_letters/company_a_cover.pdf"
        )
        app2 = create_test_application(
            company_name="Company B",
            cover_letter_filename="company_b_cover.pdf",
            cover_letter_file_path="uploads/cover_letters/company_b_cover.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # All applications should be returned with their respective file paths
        paths = [app["cover_letter_file_path"] for app in result]
        assert "uploads/cover_letters/company_a_cover.pdf" in paths
        assert "uploads/cover_letters/company_b_cover.pdf" in paths

    def test_get_all_cover_letters_with_notes(self, client, create_test_application):
        """Test getting cover letters with applications that have notes"""
        # Create applications with and without notes
        app1 = create_test_application(
            company_name="With Notes",
            cover_letter_filename="cover1.pdf",
            notes="This is a test note about the application"
        )
        app2 = create_test_application(
            company_name="Without Notes",
            cover_letter_filename="cover2.pdf",
            notes=None
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # Find applications with and without notes
        with_notes = next(app for app in result if app["company_name"] == "With Notes")
        without_notes = next(app for app in result if app["company_name"] == "Without Notes")
        
        assert with_notes["notes"] == "This is a test note about the application"
        assert without_notes["notes"] is None

    def test_get_all_cover_letters_with_portal_urls(self, client, create_test_application):
        """Test getting cover letters with applications that have portal URLs"""
        # Create applications with and without portal URLs
        app1 = create_test_application(
            company_name="With Portal",
            cover_letter_filename="cover1.pdf",
            portal_url="https://company.com/careers/portal"
        )
        app2 = create_test_application(
            company_name="Without Portal",
            cover_letter_filename="cover2.pdf",
            portal_url=None
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # Find applications with and without portal URLs
        with_portal = next(app for app in result if app["company_name"] == "With Portal")
        without_portal = next(app for app in result if app["company_name"] == "Without Portal")
        
        assert with_portal["portal_url"] == "https://company.com/careers/portal"
        assert without_portal["portal_url"] is None

    def test_get_all_cover_letters_with_different_emails(self, client, create_test_application):
        """Test getting cover letters with applications using different emails"""
        # Create applications with different emails
        app1 = create_test_application(
            company_name="Company A",
            cover_letter_filename="cover1.pdf",
            email_used="personal@example.com"
        )
        app2 = create_test_application(
            company_name="Company B",
            cover_letter_filename="cover2.pdf",
            email_used="work@example.com"
        )
        app3 = create_test_application(
            company_name="Company C",
            cover_letter_filename="cover3.pdf",
            email_used="career@example.com"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 3
        
        # All applications should be returned with their respective emails
        emails = [app["email_used"] for app in result]
        assert "personal@example.com" in emails
        assert "work@example.com" in emails
        assert "career@example.com" in emails

    def test_get_all_cover_letters_with_special_characters(self, client, create_test_application):
        """Test getting cover letters with special characters in company names and job titles"""
        # Create applications with special characters
        app1 = create_test_application(
            company_name="Tech & Co. (Inc.)",
            job_title="Senior Software Engineer - Full Stack",
            cover_letter_filename="cover1.pdf"
        )
        app2 = create_test_application(
            company_name="Startup.io",
            job_title="DevOps Engineer (AWS/GCP)",
            cover_letter_filename="cover2.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # All applications should be returned with special characters preserved
        companies = [app["company_name"] for app in result]
        titles = [app["job_title"] for app in result]
        
        assert "Tech & Co. (Inc.)" in companies
        assert "Startup.io" in companies
        assert "Senior Software Engineer - Full Stack" in titles
        assert "DevOps Engineer (AWS/GCP)" in titles

    def test_get_all_cover_letters_with_unicode_characters(self, client, create_test_application):
        """Test getting cover letters with unicode characters"""
        # Create applications with unicode characters
        app1 = create_test_application(
            company_name="Café & Co.",
            job_title="Développeur Senior",
            cover_letter_filename="cover1.pdf"
        )
        app2 = create_test_application(
            company_name="Tech Solutions 🚀",
            job_title="Software Engineer 💻",
            cover_letter_filename="cover2.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # All applications should be returned with unicode characters preserved
        companies = [app["company_name"] for app in result]
        titles = [app["job_title"] for app in result]
        
        assert "Café & Co." in companies
        assert "Tech Solutions 🚀" in companies
        assert "Développeur Senior" in titles
        assert "Software Engineer 💻" in titles

    def test_get_all_cover_letters_with_long_text(self, client, create_test_application):
        """Test getting cover letters with long text in fields"""
        # Create applications with long text
        long_company = "A" * 100
        long_title = "B" * 200
        long_notes = "C" * 500
        
        app1 = create_test_application(
            company_name=long_company,
            job_title=long_title,
            notes=long_notes,
            cover_letter_filename="cover.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        
        # Long text should be preserved
        assert result[0]["company_name"] == long_company
        assert result[0]["job_title"] == long_title
        assert result[0]["notes"] == long_notes

    def test_get_all_cover_letters_with_newlines_in_notes(self, client, create_test_application):
        """Test getting cover letters with newlines in notes"""
        # Create application with newlines in notes
        notes_with_newlines = "First line\nSecond line\nThird line"
        
        app = create_test_application(
            company_name="Test Company",
            notes=notes_with_newlines,
            cover_letter_filename="cover.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        
        # Newlines should be preserved
        assert result[0]["notes"] == notes_with_newlines

    def test_get_all_cover_letters_with_tabs_in_notes(self, client, create_test_application):
        """Test getting cover letters with tabs in notes"""
        # Create application with tabs in notes
        notes_with_tabs = "Field1\tField2\tField3"
        
        app = create_test_application(
            company_name="Test Company",
            notes=notes_with_tabs,
            cover_letter_filename="cover.pdf"
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        
        # Tabs should be preserved
        assert result[0]["notes"] == notes_with_tabs

    def test_get_all_cover_letters_mixed_scenarios(self, client, create_test_application):
        """Test getting cover letters with mixed scenarios"""
        # Create various applications with different combinations
        app1 = create_test_application(
            company_name="Complete App",
            job_title="Full Stack Developer",
            cover_letter_filename="complete_cover.pdf",
            cover_letter_file_path="uploads/cover_letters/complete_cover.pdf",
            portal_url="https://company.com/portal",
            notes="Complete application with all fields",
            status=ApplicationStatus.INTERVIEW
        )
        
        app2 = create_test_application(
            company_name="Minimal App",
            job_title="Developer",
            cover_letter_filename="minimal_cover.pdf",
            cover_letter_file_path="uploads/cover_letters/minimal_cover.pdf",
            portal_url=None,
            notes=None,
            status=ApplicationStatus.APPLIED
        )
        
        app3 = create_test_application(
            company_name="No Cover Letter",
            job_title="Engineer",
            cover_letter_filename=None,
            cover_letter_file_path=None
        )
        
        response = client.get("/api/cover-letters/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2  # Only applications with cover letters
        
        # Check that only applications with cover letters are returned
        companies = [app["company_name"] for app in result]
        assert "Complete App" in companies
        assert "Minimal App" in companies
        assert "No Cover Letter" not in companies
        
        # Check that all fields are properly returned
        complete_app = next(app for app in result if app["company_name"] == "Complete App")
        minimal_app = next(app for app in result if app["company_name"] == "Minimal App")
        
        assert complete_app["portal_url"] == "https://company.com/portal"
        assert complete_app["notes"] == "Complete application with all fields"
        assert complete_app["status"] == ApplicationStatus.INTERVIEW.value
        
        assert minimal_app["portal_url"] is None
        assert minimal_app["notes"] is None
        assert minimal_app["status"] == ApplicationStatus.APPLIED.value 