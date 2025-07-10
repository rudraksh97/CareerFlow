import pytest
from datetime import datetime, timedelta
from app.models.application import ApplicationStatus, ApplicationSource
from app.models.contact import ContactType


class TestIntegrationScenarios:
    """Integration tests for complete system workflows"""

    def test_complete_application_workflow(self, client, sample_pdf_file, sample_docx_file):
        """Test complete application workflow from creation to analytics"""
        # 1. Create a profile
        profile_data = {
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "headline": "Software Engineer",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        assert response.status_code == 200
        
        # 2. Create an application with files
        with open(sample_pdf_file, "rb") as resume_f, open(sample_docx_file, "rb") as cover_f:
            files = {
                "resume": ("test_resume.pdf", resume_f, "application/pdf"),
                "cover_letter": ("test_cover.docx", cover_f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            }
            data = {
                "company_name": "Tech Corp",
                "job_title": "Senior Software Engineer",
                "job_id": "tech-123",
                "job_url": "https://techcorp.com/job/123",
                "portal_url": "https://techcorp.com/careers",
                "status": ApplicationStatus.APPLIED.value,
                "date_applied": datetime.utcnow().isoformat(),
                "email_used": "john.doe@example.com",
                "source": ApplicationSource.LINKEDIN.value,
                "notes": "Great opportunity at Tech Corp"
            }
            
            response = client.post("/api/applications/", data=data, files=files)
            assert response.status_code == 200
            application = response.json()
        
        # 3. Create a contact
        contact_data = {
            "name": "Jane Smith",
            "email": "jane.smith@techcorp.com",
            "company": "Tech Corp",
            "role": "Senior Recruiter",
            "linkedin_url": "https://linkedin.com/in/janesmith",
            "contact_type": ContactType.RECRUITER.value,
            "notes": "Main recruiter for the position"
        }
        
        response = client.post("/api/contacts/", json=contact_data)
        assert response.status_code == 200
        contact = response.json()
        
        # 4. Create an interaction with the contact
        interaction_data = {
            "interaction_type": "email",
            "notes": "Sent follow-up email about application",
            "date": datetime.utcnow().isoformat()
        }
        
        response = client.post(f"/api/contacts/{contact['id']}/interactions/", json=interaction_data)
        assert response.status_code == 200
        
        # 5. Create a referral message template
        message_data = {
            "title": "Follow-up Template",
            "message_type": "follow_up",
            "subject_template": "Following up on {position_title} application",
            "message_template": "Hi {contact_name},\n\nI hope this email finds you well. I wanted to follow up on my application for the {position_title} position at {company_name}...",
            "target_company": "Tech Corp",
            "target_position": "Senior Software Engineer",
            "is_active": True,
            "notes": "Template for following up on applications"
        }
        
        response = client.post("/api/referral-messages/", json=message_data)
        assert response.status_code == 200
        template = response.json()
        
        # 6. Generate a referral message
        generation_data = {
            "template_id": template["id"],
            "contact_name": "Jane Smith",
            "company_name": "Tech Corp",
            "position_title": "Senior Software Engineer",
            "your_name": "John Doe"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        assert response.status_code == 200
        generated_message = response.json()
        assert "Jane Smith" in generated_message["message"]
        assert "Tech Corp" in generated_message["message"]
        
        # 7. Update application status
        update_data = {
            "status": ApplicationStatus.INTERVIEW.value,
            "notes": "Received interview invitation"
        }
        
        response = client.put(f"/api/applications/{application['id']}", json=update_data)
        assert response.status_code == 200
        updated_app = response.json()
        assert updated_app["status"] == ApplicationStatus.INTERVIEW.value
        
        # 8. Check analytics
        response = client.get("/api/analytics/dashboard/")
        assert response.status_code == 200
        analytics = response.json()
        
        assert analytics["total_applications"] == 1
        assert analytics["applications_by_status"]["interview"] == 1
        assert analytics["total_contacts"] == 1
        assert analytics["contacts_by_type"]["recruiter"] == 1
        
        # 9. Download resume
        response = client.get(f"/api/applications/{application['id']}/resume")
        assert response.status_code == 200
        
        # 10. Download cover letter
        response = client.get(f"/api/applications/{application['id']}/cover-letter")
        assert response.status_code == 200

    def test_contact_management_workflow(self, client):
        """Test complete contact management workflow"""
        # 1. Create multiple contacts
        contacts_data = [
            {
                "name": "Alice Johnson",
                "email": "alice@company1.com",
                "company": "Company 1",
                "role": "Hiring Manager",
                "contact_type": ContactType.HIRING_MANAGER.value
            },
            {
                "name": "Bob Wilson",
                "email": "bob@company2.com",
                "company": "Company 2",
                "role": "Recruiter",
                "contact_type": ContactType.RECRUITER.value
            },
            {
                "name": "Carol Davis",
                "email": "carol@company3.com",
                "company": "Company 3",
                "role": "Engineering Manager",
                "contact_type": ContactType.HIRING_MANAGER.value
            }
        ]
        
        created_contacts = []
        for contact_data in contacts_data:
            response = client.post("/api/contacts/", json=contact_data)
            assert response.status_code == 200
            created_contacts.append(response.json())
        
        # 2. Search contacts
        response = client.get("/api/contacts/search/?q=Company 1")
        assert response.status_code == 200
        search_results = response.json()
        assert len(search_results) == 1
        assert search_results[0]["company"] == "Company 1"
        
        # 3. Filter contacts by type
        response = client.get(f"/api/contacts/?contact_type={ContactType.HIRING_MANAGER.value}")
        assert response.status_code == 200
        filtered_contacts = response.json()
        assert len(filtered_contacts) == 2
        
        # 4. Add interactions to contacts
        for contact in created_contacts:
            interaction_data = {
                "interaction_type": "email",
                "notes": f"Initial contact with {contact['name']}",
                "date": datetime.utcnow().isoformat()
            }
            
            response = client.post(f"/api/contacts/{contact['id']}/interactions/", json=interaction_data)
            assert response.status_code == 200
        
        # 5. Update a contact
        update_data = {
            "role": "Senior Hiring Manager",
            "notes": "Promoted to senior position"
        }
        
        response = client.put(f"/api/contacts/{created_contacts[0]['id']}/", json=update_data)
        assert response.status_code == 200
        updated_contact = response.json()
        assert updated_contact["role"] == "Senior Hiring Manager"
        
        # 6. Check contact analytics
        response = client.get("/api/analytics/dashboard/")
        assert response.status_code == 200
        contact_analytics = response.json()
        
        assert contact_analytics["total_contacts"] == 3
        assert contact_analytics["contacts_by_type"]["hiring_manager"] == 2
        assert contact_analytics["contacts_by_type"]["recruiter"] == 1
        assert contact_analytics["recent_interactions"] == 3

    def test_referral_message_workflow(self, client):
        """Test complete referral message workflow"""
        # 1. Create multiple message templates
        templates_data = [
            {
                "title": "Cold Outreach",
                "message_type": "cold_outreach",
                "subject_template": "Interested in {position_title} at {company_name}",
                "message_template": "Hi {contact_name},\n\nI'm reaching out about the {position_title} position at {company_name}...",
                "is_active": True
            },
            {
                "title": "Follow-up",
                "message_type": "follow_up",
                "subject_template": "Following up on {position_title}",
                "message_template": "Hi {contact_name},\n\nI wanted to follow up on my application for the {position_title} position...",
                "is_active": True
            },
            {
                "title": "Thank You",
                "message_type": "thank_you",
                "subject_template": "Thank you for the interview",
                "message_template": "Hi {contact_name},\n\nThank you for taking the time to interview me for the {position_title} position...",
                "is_active": False
            }
        ]
        
        created_templates = []
        for template_data in templates_data:
            response = client.post("/api/referral-messages/", json=template_data)
            assert response.status_code == 200
            created_templates.append(response.json())
        
        # 2. Get all templates
        response = client.get("/api/referral-messages/")
        assert response.status_code == 200
        all_templates = response.json()
        assert len(all_templates) == 3
        
        # 3. Filter by message type
        response = client.get("/api/referral-messages/?message_type=cold_outreach")
        assert response.status_code == 200
        cold_outreach_templates = response.json()
        assert len(cold_outreach_templates) == 1
        
        # 4. Filter by active status
        response = client.get("/api/referral-messages/?is_active=true")
        assert response.status_code == 200
        active_templates = response.json()
        assert len(active_templates) == 2
        
        # 5. Generate messages from templates
        generation_data = {
            "template_id": created_templates[0]["id"],
            "contact_name": "John Smith",
            "company_name": "Tech Startup",
            "position_title": "Software Engineer",
            "your_name": "Jane Doe"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        assert response.status_code == 200
        generated_message = response.json()
        assert "John Smith" in generated_message["message"]
        assert "Tech Startup" in generated_message["message"]
        
        # 6. Update template
        update_data = {
            "title": "Updated Cold Outreach",
            "is_active": False
        }
        
        response = client.put(f"/api/referral-messages/{created_templates[0]['id']}/", json=update_data)
        assert response.status_code == 200
        updated_template = response.json()
        assert updated_template["title"] == "Updated Cold Outreach"
        assert updated_template["is_active"] is False
        
        # 7. Attempt to generate message from inactive template
        generation_data = {
            "template_id": created_templates[0]["id"],
            "contact_name": "Test Contact",
            "company_name": "Test Company",
            "position_title": "Test Position"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        assert response.status_code == 400
        assert "Template is inactive" in response.json()["detail"]

    def test_analytics_workflow(self, client, create_test_application, create_test_contact, create_test_interaction):
        """Test complete analytics workflow"""
        # 1. Create applications with different statuses and sources
        now = datetime.utcnow()
        
        # Applications with different statuses
        create_test_application(
            company_name="Company A",
            status=ApplicationStatus.APPLIED,
            source=ApplicationSource.LINKEDIN,
            date_applied=now
        )
        create_test_application(
            company_name="Company B",
            status=ApplicationStatus.INTERVIEW,
            source=ApplicationSource.INDEED,
            date_applied=now - timedelta(days=5)
        )
        create_test_application(
            company_name="Company C",
            status=ApplicationStatus.OFFER,
            source=ApplicationSource.COMPANY_WEBSITE,
            date_applied=now - timedelta(days=10)
        )
        create_test_application(
            company_name="Company D",
            status=ApplicationStatus.REJECTED,
            source=ApplicationSource.LINKEDIN,
            date_applied=now - timedelta(days=15)
        )
        
        # 2. Create contacts with different types
        contact1 = create_test_contact(
            name="Alice",
            company="Company A",
            contact_type=ContactType.RECRUITER
        )
        contact2 = create_test_contact(
            name="Bob",
            company="Company B",
            contact_type=ContactType.HIRING_MANAGER
        )
        contact3 = create_test_contact(
            name="Carol",
            company="Company C",
            contact_type=ContactType.REFERRAL
        )
        
        # 3. Create interactions
        create_test_interaction(contact1.id, date=now)
        create_test_interaction(contact2.id, date=now - timedelta(days=3))
        create_test_interaction(contact3.id, date=now - timedelta(days=7))
        
        # 4. Test dashboard analytics
        response = client.get("/api/analytics/dashboard/")
        assert response.status_code == 200
        dashboard = response.json()
        
        assert dashboard["total_applications"] == 4
        assert dashboard["applications_by_status"]["interview"] == 1
        assert dashboard["total_contacts"] == 3
        assert dashboard["contacts_by_type"]["recruiter"] == 1
        
        # 5. Test application analytics
        response = client.get("/api/analytics/applications/")
        assert response.status_code == 200
        app_analytics = response.json()
        
        assert app_analytics["total_applications"] == 4
        assert app_analytics["success_rate"] == 50.0
        assert app_analytics["applications_by_status"]["applied"] == 1
        assert app_analytics["applications_by_status"]["interview"] == 1
        assert app_analytics["applications_by_status"]["offer"] == 1
        assert app_analytics["applications_by_status"]["rejected"] == 1
        
        # 6. Test contact analytics
        response = client.get("/api/analytics/contacts/")
        assert response.status_code == 200
        contact_analytics = response.json()
        
        assert contact_analytics["total_contacts"] == 3
        assert contact_analytics["contacts_by_type"]["recruiter"] == 1
        assert contact_analytics["contacts_by_type"]["hiring_manager"] == 1
        assert contact_analytics["contacts_by_type"]["referral"] == 1
        assert contact_analytics["recent_interactions"] == 3
        
        # 7. Test trends analytics
        response = client.get("/api/analytics/applications/trends?days=365")
        assert response.status_code == 200
        trends = response.json()
        
        # 8. Test performance metrics
        response = client.get("/api/analytics/performance/")
        assert response.status_code == 200
        performance = response.json()
        
        assert performance["total_applications"] == 4
        assert performance["interview_rate"] == 50.0  # 2 interviews out of 4
        assert performance["offer_rate"] == 25.0  # 1 offer out of 4
        assert performance["success_rate"] == 25.0  # 1 success out of 4
        
        # 9. Test data export
        response = client.get("/api/analytics/export/data?format=json")
        assert response.status_code == 200
        export_data = response.json()
        
        assert export_data["total_applications"] == 4
        assert export_data["total_contacts"] == 3
        assert len(export_data["applications"]) == 4
        assert len(export_data["contacts"]) == 3

    def test_settings_workflow(self, client):
        """Test complete settings workflow"""
        # 1. Create various settings
        settings_data = [
            {
                "key": "openai_api_key",
                "value": "sk-test1234567890abcdef"
            },
            {
                "key": "email_notifications",
                "value": "true"
            },
            {
                "key": "max_applications_per_month",
                "value": "50"
            },
            {
                "key": "backup_frequency",
                "value": "daily"
            }
        ]
        
        created_settings = []
        for setting_data in settings_data:
            response = client.post("/api/settings/", json=setting_data)
            assert response.status_code == 200
            created_settings.append(response.json())
        
        # 2. Get individual settings
        for setting in created_settings:
            response = client.get(f"/api/settings/{setting['key']}")
            assert response.status_code == 200
            retrieved_setting = response.json()
            assert retrieved_setting["key"] == setting["key"]
            assert retrieved_setting["value"] == setting["value"]
        
        # 3. Update settings
        update_data = {
            "key": "email_notifications",
            "value": "false"
        }
        
        response = client.post("/api/settings/", json=update_data)
        assert response.status_code == 200
        updated_setting = response.json()
        assert updated_setting["value"] == "false"
        
        # 4. Test getting non-existent setting
        response = client.get("/api/settings/non_existent_key")
        assert response.status_code == 404

    def test_file_management_workflow(self, client, sample_pdf_file, sample_docx_file):
        """Test complete file management workflow"""
        # 1. Create application with resume and cover letter
        with open(sample_pdf_file, "rb") as resume_f, open(sample_docx_file, "rb") as cover_f:
            files = {
                "resume": ("test_resume.pdf", resume_f, "application/pdf"),
                "cover_letter": ("test_cover.docx", cover_f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            }
            data = {
                "company_name": "File Test Company",
                "job_title": "File Test Job",
                "job_id": "file-test-123",
                "job_url": "https://example.com/job/file-test",
                "status": ApplicationStatus.APPLIED.value,
                "date_applied": datetime.utcnow().isoformat(),
                "email_used": "test@example.com",
                "source": ApplicationSource.LINKEDIN.value
            }
            
            response = client.post("/api/applications/", data=data, files=files)
            assert response.status_code == 200
            application = response.json()
        
        # 2. List resumes
        response = client.get("/api/resumes/")
        assert response.status_code == 200
        resumes = response.json()
        assert len(resumes) == 1
        assert resumes[0]["resume_filename"].endswith(".pdf")
        
        # 3. List cover letters
        response = client.get("/api/cover-letters/")
        assert response.status_code == 200
        cover_letters = response.json()
        assert len(cover_letters) == 1
        assert cover_letters[0]["cover_letter_filename"].endswith(".docx")
        
        # 4. Download resume
        response = client.get(f"/api/applications/{application['id']}/resume")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
        assert "test_resume.pdf" in response.headers["content-disposition"]
        
        # 5. Download cover letter
        response = client.get(f"/api/applications/{application['id']}/cover-letter")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
        assert "test_cover.docx" in response.headers["content-disposition"]

    def test_error_handling_workflow(self, client, sample_pdf_file):
        """Test various error handling scenarios"""
        # 1. Create application with missing required fields
        response = client.post("/api/applications/", data={}, files={})
        assert response.status_code == 422  # Validation error
        
        # 2. Get non-existent application
        response = client.get("/api/applications/non-existent-id/")
        assert response.status_code == 404
        assert "Application not found" in response.json()["detail"]
        
        # 3. Test getting non-existent contact
        response = client.get("/api/contacts/non-existent-id/")
        assert response.status_code == 404
        assert "Contact not found" in response.json()["detail"]
        
        # 4. Test getting non-existent referral message
        response = client.get("/api/referral-messages/non-existent-id/")
        assert response.status_code == 404
        assert "Referral message not found" in response.json()["detail"]
        
        # 5. Test getting non-existent setting
        response = client.get("/api/settings/non-existent-key")
        assert response.status_code == 404
        assert "Setting not found" in response.json()["detail"]
        
        # 6. Test invalid data validation
        invalid_contact_data = {
            "name": "Test Contact"
            # Missing required fields
        }
        
        response = client.post("/api/contacts/", json=invalid_contact_data)
        assert response.status_code == 422  # Validation error
        
        # 7. Test invalid email format
        invalid_profile_data = {
            "full_name": "Test User",
            "email": "invalid-email",
            "headline": "Developer"
        }
        
        response = client.post("/api/profile/", json=invalid_profile_data)
        assert response.status_code == 422  # Validation error
        
        # 8. Test invalid URL format (using contact creation with invalid LinkedIn URL)
        invalid_contact_with_url = {
            "name": "Test Contact",
            "email": "test@example.com",
            "company": "Test Company",
            "contact_type": "recruiter",
            "linkedin_url": "not-a-valid-url"
        }
        
        response = client.post("/api/contacts/", json=invalid_contact_with_url)
        assert response.status_code == 422  # Validation error