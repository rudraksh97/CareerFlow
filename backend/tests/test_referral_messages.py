import pytest
from datetime import datetime
from app.models.referral_message import ReferralMessageType


class TestReferralMessagesAPI:
    """Test suite for referral messages API endpoints"""

    def test_create_referral_message_success(self, client):
        """Test successful referral message creation"""
        message_data = {
            "title": "Cold Outreach Template",
            "message_type": ReferralMessageType.COLD_OUTREACH.value,
            "subject_template": "Interested in {position_title} at {company_name}",
            "message_template": "Hi {contact_name},\n\nI'm interested in the {position_title} position at {company_name}...",
            "target_company": "Test Company",
            "target_position": "Software Engineer",
            "is_active": True,
            "notes": "Test template notes"
        }
        
        response = client.post("/api/referral-messages/", json=message_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["title"] == "Cold Outreach Template"
        assert result["message_type"] == ReferralMessageType.COLD_OUTREACH.value
        assert result["subject_template"] == "Interested in {position_title} at {company_name}"
        assert result["message_template"] == "Hi {contact_name},\n\nI'm interested in the {position_title} position at {company_name}..."
        assert result["target_company"] == "Test Company"
        assert result["target_position"] == "Software Engineer"
        assert result["is_active"] is True
        assert result["notes"] == "Test template notes"
        assert "id" in result
        assert "created_at" in result
        assert "updated_at" in result

    def test_create_referral_message_minimal_data(self, client):
        """Test referral message creation with minimal required data"""
        message_data = {
            "title": "Simple Template",
            "message_type": ReferralMessageType.NETWORKING.value,
            "message_template": "Hi {contact_name}, I'd like to connect..."
        }
        
        response = client.post("/api/referral-messages/", json=message_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["title"] == "Simple Template"
        assert result["message_type"] == ReferralMessageType.NETWORKING.value
        assert result["message_template"] == "Hi {contact_name}, I'd like to connect..."
        assert result["subject_template"] is None
        assert result["target_company"] is None
        assert result["target_position"] is None
        assert result["is_active"] is True
        assert result["notes"] is None

    def test_create_referral_message_missing_required_fields(self, client):
        """Test referral message creation with missing required fields"""
        message_data = {
            "title": "Incomplete Template"
            # Missing message_type and message_template
        }
        
        response = client.post("/api/referral-messages/", json=message_data)
        
        assert response.status_code == 422  # Validation error

    def test_create_referral_message_invalid_message_type(self, client):
        """Test referral message creation with invalid message type"""
        message_data = {
            "title": "Test Template",
            "message_type": "invalid_type",
            "message_template": "Test message"
        }
        
        response = client.post("/api/referral-messages/", json=message_data)
        
        assert response.status_code == 422  # Validation error

    def test_get_referral_messages_list(self, client, create_test_referral_message):
        """Test getting list of referral messages"""
        # Create test messages
        msg1 = create_test_referral_message(
            title="Template A",
            message_type=ReferralMessageType.COLD_OUTREACH
        )
        msg2 = create_test_referral_message(
            title="Template B",
            message_type=ReferralMessageType.WARM_INTRODUCTION
        )
        
        response = client.get("/api/referral-messages/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        assert any(msg["id"] == msg1.id for msg in result)
        assert any(msg["id"] == msg2.id for msg in result)

    def test_get_referral_messages_with_filters(self, client, create_test_referral_message):
        """Test getting referral messages with filters"""
        # Create test messages with different types and companies
        msg1 = create_test_referral_message(
            title="Template A",
            message_type=ReferralMessageType.COLD_OUTREACH,
            target_company="Company A",
            is_active=True
        )
        msg2 = create_test_referral_message(
            title="Template B",
            message_type=ReferralMessageType.WARM_INTRODUCTION,
            target_company="Company B",
            is_active=False
        )
        
        # Test message type filter
        response = client.get(f"/api/referral-messages/?message_type={ReferralMessageType.COLD_OUTREACH.value}")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["message_type"] == ReferralMessageType.COLD_OUTREACH.value
        
        # Test target company filter
        response = client.get("/api/referral-messages/?target_company=Company A")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["target_company"] == "Company A"
        
        # Test is_active filter
        response = client.get("/api/referral-messages/?is_active=true")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["is_active"] is True

    def test_get_referral_message_by_id(self, client, create_test_referral_message):
        """Test getting a specific referral message by ID"""
        message = create_test_referral_message()
        
        response = client.get(f"/api/referral-messages/{message.id}/")
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == message.id
        assert result["title"] == message.title
        assert result["message_type"] == message.message_type.value

    def test_get_referral_message_by_id_not_found(self, client):
        """Test getting non-existent referral message"""
        response = client.get("/api/referral-messages/non-existent-id/")
        
        assert response.status_code == 404
        assert "Referral message not found" in response.json()["detail"]

    def test_update_referral_message(self, client, create_test_referral_message):
        """Test updating a referral message"""
        message = create_test_referral_message()
        
        update_data = {
            "title": "Updated Template",
            "is_active": False,
            "notes": "Updated notes"
        }
        
        response = client.put(f"/api/referral-messages/{message.id}/", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["title"] == "Updated Template"
        assert result["is_active"] is False
        assert result["notes"] == "Updated notes"

    def test_update_referral_message_not_found(self, client):
        """Test updating non-existent referral message"""
        update_data = {"title": "Updated Template"}
        
        response = client.put("/api/referral-messages/non-existent-id/", json=update_data)
        
        assert response.status_code == 404
        assert "Referral message not found" in response.json()["detail"]

    def test_delete_referral_message(self, client, create_test_referral_message):
        """Test deleting a referral message"""
        message = create_test_referral_message()
        
        response = client.delete(f"/api/referral-messages/{message.id}/")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Referral message deleted successfully"
        
        # Verify it's deleted
        get_response = client.get(f"/api/referral-messages/{message.id}/")
        assert get_response.status_code == 404

    def test_delete_referral_message_not_found(self, client):
        """Test deleting non-existent referral message"""
        response = client.delete("/api/referral-messages/non-existent-id/")
        
        assert response.status_code == 404
        assert "Referral message not found" in response.json()["detail"]

    def test_get_message_types(self, client):
        """Test getting all available message types"""
        response = client.get("/api/referral-messages/types/")
        
        assert response.status_code == 200
        result = response.json()
        expected_types = [msg_type.value for msg_type in ReferralMessageType]
        assert result == expected_types

    def test_pagination(self, client, create_test_referral_message):
        """Test pagination for referral messages list"""
        # Create 15 messages
        for i in range(15):
            create_test_referral_message(
                title=f"Template {i}",
                message_type=ReferralMessageType.COLD_OUTREACH
            )
        
        # Test first page
        response = client.get("/api/referral-messages/?skip=0&limit=10")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 10
        
        # Test second page
        response = client.get("/api/referral-messages/?skip=10&limit=10")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 5  # Only 5 remaining

    def test_pagination_invalid_params(self, client):
        """Test pagination with invalid parameters"""
        # Negative skip
        response = client.get("/api/referral-messages/?skip=-1")
        assert response.status_code == 422
        
        # Zero limit
        response = client.get("/api/referral-messages/?limit=0")
        assert response.status_code == 422
        
        # Too large limit
        response = client.get("/api/referral-messages/?limit=1001")
        assert response.status_code == 422


class TestReferralMessageGeneration:
    """Test suite for referral message generation functionality"""

    def test_generate_referral_message_success(self, client, create_test_referral_message):
        """Test successful referral message generation"""
        # Create a template
        template = create_test_referral_message(
            title="Test Template",
            message_type=ReferralMessageType.COLD_OUTREACH,
            subject_template="Interested in {position_title} at {company_name}",
            message_template="Hi {contact_name},\n\nI'm interested in the {position_title} position at {company_name}...",
            target_company="Test Company",
            target_position="Software Engineer"
        )
        
        generation_data = {
            "template_id": template.id,
            "contact_name": "John Doe",
            "company_name": "Test Company",
            "position_title": "Software Engineer",
            "your_name": "Jane Smith",
            "your_background": "Experienced developer"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        
        assert response.status_code == 200
        result = response.json()
        assert "subject" in result
        assert "message" in result
        assert result["template_title"] == "Test Template"
        assert "variables_used" in result
        assert "John Doe" in result["message"]
        assert "Test Company" in result["message"]
        assert "Software Engineer" in result["message"]

    def test_generate_referral_message_template_not_found(self, client):
        """Test generating a message from an inactive template"""
        generation_data = {
            "template_id": "non-existent-id",
            "contact_name": "John Doe"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        
        assert response.status_code == 404
        assert "Template not found" in response.json()["detail"]

    def test_generate_referral_message_inactive_template(self, client, create_test_referral_message):
        """Test generating a message from an inactive template"""
        template = create_test_referral_message(
            title="Inactive Template",
            is_active=False
        )
        
        generation_data = {
            "template_id": template.id,
            "contact_name": "John Doe"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        
        assert response.status_code == 400
        assert "inactive" in response.json()["detail"]

    def test_generate_referral_message_missing_variables(self, client, create_test_referral_message):
        """Test generating a message with missing variables"""
        template = create_test_referral_message(
            title="Template with Variables",
            message_template="Hi {contact_name}, I work at {company_name} and am interested in the {position_title} role..."
        )
        
        generation_data = {
            "template_id": template.id,
            "contact_name": "Test Contact",
            "company_name": "Test Company",
            # Missing position_title
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        
        assert response.status_code == 200
        result = response.json()
        assert "Hi Test Contact" in result["message"]
        assert "Test Company" in result["message"]
        assert "[Position Title]" in result["message"]

    def test_generate_referral_message_with_custom_variables(self, client, create_test_referral_message):
        """Test generating a message with custom variables"""
        template = create_test_referral_message(
            title="Custom Template",
            message_template="Hi {contact_name}, I'm {your_name} and I {custom_action}..."
        )
        
        generation_data = {
            "template_id": template.id,
            "contact_name": "John Doe",
            "your_name": "Jane Smith",
            "custom_variables": {
                "custom_action": "love coding"
            }
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        
        assert response.status_code == 200
        result = response.json()
        assert "Hi John Doe, I'm Jane Smith and I love coding..." in result["message"]

    def test_generate_referral_message_no_subject_template(self, client, create_test_referral_message):
        """Test generating message without subject template"""
        template = create_test_referral_message(
            title="No Subject Template",
            subject_template=None,
            message_template="Hi {contact_name}..."
        )
        
        generation_data = {
            "template_id": template.id,
            "contact_name": "John Doe"
        }
        
        response = client.post("/api/referral-messages/generate/", json=generation_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["subject"] is None
        assert "Hi John Doe..." in result["message"]

    def test_generate_referral_message_usage_count_increment(self, client, create_test_referral_message):
        """Test that usage count increments when generating messages"""
        template = create_test_referral_message(
            title="Usage Test Template",
            message_template="Hi {contact_name}..."
        )
        
        initial_usage = int(template.usage_count)
        
        generation_data = {
            "template_id": template.id,
            "contact_name": "John Doe"
        }
        
        # Generate message multiple times
        for i in range(3):
            response = client.post("/api/referral-messages/generate/", json=generation_data)
            assert response.status_code == 200
        
        # Check that usage count increased
        get_response = client.get(f"/api/referral-messages/{template.id}/")
        assert get_response.status_code == 200
        updated_template = get_response.json()
        assert int(updated_template["usage_count"]) == initial_usage + 3 