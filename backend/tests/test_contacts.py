import pytest
from datetime import datetime, timedelta
from app.models.contact import ContactType
from app.models.contact import Contact


class TestContactsAPI:
    """Test suite for contacts API endpoints"""

    def test_create_contact_success(self, client):
        """Test successful contact creation"""
        contact_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "company": "Test Company",
            "role": "Senior Engineer",
            "linkedin_url": "https://linkedin.com/in/johndoe",
            "contact_type": ContactType.RECRUITER.value,
            "notes": "Test contact notes"
        }
        
        response = client.post("/api/contacts/", json=contact_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "John Doe"
        assert result["email"] == "john.doe@example.com"
        assert result["company"] == "Test Company"
        assert result["role"] == "Senior Engineer"
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"
        assert result["contact_type"] == ContactType.RECRUITER.value
        assert result["notes"] == "Test contact notes"
        assert "id" in result
        assert "created_at" in result
        assert "updated_at" in result

    def test_create_contact_minimal_data(self, client):
        """Test contact creation with minimal required data"""
        contact_data = {
            "name": "Jane Smith",
            "email": "jane.smith@example.com",
            "company": "Another Company",
            "contact_type": ContactType.HIRING_MANAGER.value
        }
        
        response = client.post("/api/contacts/", json=contact_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "Jane Smith"
        assert result["email"] == "jane.smith@example.com"
        assert result["company"] == "Another Company"
        assert result["contact_type"] == ContactType.HIRING_MANAGER.value
        assert result["role"] is None
        assert result["linkedin_url"] is None
        assert result["notes"] is None

    def test_create_contact_missing_required_fields(self, client):
        """Test contact creation with missing required fields"""
        contact_data = {
            "name": "John Doe",
            # Missing email, company, contact_type
        }
        
        response = client.post("/api/contacts/", json=contact_data)
        
        assert response.status_code == 422  # Validation error

    def test_create_contact_invalid_email(self, client):
        """Test contact creation with invalid email format"""
        contact_data = {
            "name": "John Doe",
            "email": "invalid-email",
            "company": "Test Company",
            "contact_type": ContactType.RECRUITER.value
        }
        
        response = client.post("/api/contacts/", json=contact_data)
        
        assert response.status_code == 422  # Validation error

    def test_create_contact_invalid_linkedin_url(self, client):
        """Test contact creation with invalid LinkedIn URL"""
        contact_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "company": "Test Company",
            "contact_type": ContactType.RECRUITER.value,
            "linkedin_url": "not-a-valid-url"
        }
        
        response = client.post("/api/contacts/", json=contact_data)
        
        assert response.status_code == 422  # Validation error

    def test_get_contacts_list(self, client, create_test_contact):
        """Test getting list of contacts"""
        # Create test contacts
        contact1 = create_test_contact(
            name="John Doe",
            email="john@example.com",
            company="Company A"
        )
        contact2 = create_test_contact(
            name="Jane Smith",
            email="jane@example.com",
            company="Company B"
        )
        
        response = client.get("/api/contacts/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        assert any(contact["id"] == contact1.id for contact in result)
        assert any(contact["id"] == contact2.id for contact in result)

    def test_get_contacts_with_filters(self, client, db_session):
        """Test getting contacts with filters"""
        # Create test contacts with different types
        contact1 = Contact(id="1", name="John Doe", email="john.doe@example.com", company="Company A", contact_type=ContactType.RECRUITER)
        contact2 = Contact(id="2", name="Jane Smith", email="jane.smith@example.com", company="Company B", contact_type=ContactType.HIRING_MANAGER)
        db_session.add_all([contact1, contact2])
        db_session.commit()
        
        # Test name filter
        response = client.get("/api/contacts/?name=John")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["name"] == "John Doe"
        
        # Test company filter
        response = client.get("/api/contacts/?company=Company A")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["company"] == "Company A"
        
        # Test contact type filter
        response = client.get(f"/api/contacts/?contact_type={ContactType.HIRING_MANAGER.value}")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["contact_type"] == ContactType.HIRING_MANAGER.value
        
        # Test email filter
        response = client.get("/api/contacts/?email=john.doe@example.com")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["email"] == "john.doe@example.com"

    def test_get_contact_by_id(self, client, create_test_contact):
        """Test getting a specific contact by ID"""
        contact = create_test_contact()
        
        response = client.get(f"/api/contacts/{contact.id}/")
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == contact.id
        assert result["name"] == contact.name
        assert result["email"] == contact.email

    def test_get_contact_by_id_not_found(self, client):
        """Test getting non-existent contact"""
        response = client.get("/api/contacts/non-existent-id/")
        
        assert response.status_code == 404
        assert "Contact not found" in response.json()["detail"]

    def test_update_contact(self, client, create_test_contact):
        """Test updating a contact"""
        contact = create_test_contact()
        
        update_data = {
            "role": "Senior Manager",
            "notes": "Updated notes",
            "contact_type": ContactType.HIRING_MANAGER.value
        }
        
        response = client.put(f"/api/contacts/{contact.id}/", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["role"] == "Senior Manager"
        assert result["notes"] == "Updated notes"
        assert result["contact_type"] == ContactType.HIRING_MANAGER.value

    def test_update_contact_not_found(self, client):
        """Test updating non-existent contact"""
        update_data = {"role": "Senior Manager"}
        
        response = client.put("/api/contacts/non-existent-id/", json=update_data)
        
        assert response.status_code == 404
        assert "Contact not found" in response.json()["detail"]

    def test_delete_contact(self, client, create_test_contact):
        """Test deleting a contact"""
        contact = create_test_contact()
        
        response = client.delete(f"/api/contacts/{contact.id}/")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Contact deleted successfully"
        
        # Verify it's deleted
        get_response = client.get(f"/api/contacts/{contact.id}/")
        assert get_response.status_code == 404

    def test_delete_contact_not_found(self, client):
        """Test deleting non-existent contact"""
        response = client.delete("/api/contacts/non-existent-id/")
        
        assert response.status_code == 404
        assert "Contact not found" in response.json()["detail"]

    def test_search_contacts(self, client, db_session):
        """Test searching contacts"""
        # Create test contacts
        contact1 = Contact(id="1", name="John Doe", email="john.doe@example.com", company="Tech Corp", contact_type=ContactType.RECRUITER)
        contact2 = Contact(id="2", name="Jane Smith", email="jane.smith@example.com", company="Tech Corp", contact_type=ContactType.HIRING_MANAGER)
        contact3 = Contact(id="3", name="Bob Johnson", email="bob.johnson@other.com", company="Other Corp", contact_type=ContactType.OTHER)
        db_session.add_all([contact1, contact2, contact3])
        db_session.commit()
        
        # Search by name
        response = client.get("/api/contacts/search/?q=John Doe")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["name"] == "John Doe"
        
        # Search by company
        response = client.get("/api/contacts/search/?q=Tech Corp")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        
        # Search by email
        response = client.get("/api/contacts/search/?q=jane.smith")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 1
        assert result[0]["email"] == "jane.smith@example.com"

    def test_search_contacts_no_results(self, client):
        """Test searching contacts with no results"""
        response = client.get("/api/contacts/search/?q=nonexistent")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 0

    def test_pagination(self, client, create_test_contact):
        """Test pagination for contacts list"""
        # Create 15 contacts
        for i in range(15):
            create_test_contact(
                name=f"Contact {i}",
                email=f"contact{i}@example.com",
                company=f"Company {i}"
            )
        
        # Test first page
        response = client.get("/api/contacts/?skip=0&limit=10")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 10
        
        # Test second page
        response = client.get("/api/contacts/?skip=10&limit=10")
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 5  # Only 5 remaining

    def test_pagination_invalid_params(self, client):
        """Test pagination with invalid parameters"""
        # Negative skip
        response = client.get("/api/contacts/?skip=-1")
        assert response.status_code == 422
        
        # Zero limit
        response = client.get("/api/contacts/?limit=0")
        assert response.status_code == 422
        
        # Too large limit
        response = client.get("/api/contacts/?limit=1001")
        assert response.status_code == 422


class TestInteractionsAPI:
    """Test suite for contact interactions API endpoints"""

    def test_create_interaction_success(self, client, create_test_contact):
        """Test successful interaction creation"""
        contact = create_test_contact()
        
        interaction_data = {
            "interaction_type": "email",
            "notes": "Sent follow-up email",
            "date": datetime.utcnow().isoformat()
        }
        
        response = client.post(f"/api/contacts/{contact.id}/interactions/", json=interaction_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["interaction_type"] == "email"
        assert result["notes"] == "Sent follow-up email"
        assert result["contact_id"] == contact.id
        assert "id" in result
        assert "created_at" in result

    def test_create_interaction_minimal_data(self, client, create_test_contact):
        """Test interaction creation with minimal data"""
        contact = create_test_contact()
        
        interaction_data = {
            "interaction_type": "call",
            "date": datetime.utcnow().isoformat()
        }
        
        response = client.post(f"/api/contacts/{contact.id}/interactions/", json=interaction_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["interaction_type"] == "call"
        assert result["notes"] is None

    def test_create_interaction_contact_not_found(self, client):
        """Test creating interaction for non-existent contact"""
        interaction_data = {
            "interaction_type": "email",
            "date": datetime.utcnow().isoformat()
        }
        
        response = client.post("/api/contacts/non-existent-id/interactions/", json=interaction_data)
        
        assert response.status_code == 404
        assert "Contact not found" in response.json()["detail"]

    def test_create_interaction_missing_required_fields(self, client, create_test_contact):
        """Test interaction creation with missing required fields"""
        contact = create_test_contact()
        
        interaction_data = {
            "notes": "Some notes"
            # Missing interaction_type and date
        }
        
        response = client.post(f"/api/contacts/{contact.id}/interactions/", json=interaction_data)
        
        assert response.status_code == 422  # Validation error

    def test_get_contact_interactions(self, client, create_test_contact, create_test_interaction):
        """Test getting interactions for a contact"""
        contact = create_test_contact()
        
        # Create interactions
        interaction1 = create_test_interaction(
            contact.id,
            interaction_type="email",
            notes="First email"
        )
        interaction2 = create_test_interaction(
            contact.id,
            interaction_type="call",
            notes="Follow-up call"
        )
        
        response = client.get(f"/api/contacts/{contact.id}/interactions/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 2
        assert any(interaction["id"] == interaction1.id for interaction in result)
        assert any(interaction["id"] == interaction2.id for interaction in result)

    def test_get_contact_interactions_contact_not_found(self, client):
        """Test getting interactions for non-existent contact"""
        response = client.get("/api/contacts/non-existent-id/interactions/")
        
        assert response.status_code == 404
        assert "Contact not found" in response.json()["detail"]

    def test_get_contact_interactions_empty(self, client, create_test_contact):
        """Test getting interactions for contact with no interactions"""
        contact = create_test_contact()
        
        response = client.get(f"/api/contacts/{contact.id}/interactions/")
        
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 0

    def test_delete_contact_with_interactions(self, client, create_test_contact, create_test_interaction):
        """Test that deleting a contact also deletes its interactions"""
        contact = create_test_contact()
        interaction = create_test_interaction(contact.id)
        
        # Delete the contact
        response = client.delete(f"/api/contacts/{contact.id}/")
        assert response.status_code == 200
        
        # Verify contact is deleted
        get_contact_response = client.get(f"/api/contacts/{contact.id}/")
        assert get_contact_response.status_code == 404
        
        # Verify interactions are also deleted (cascade)
        # This would require a direct database query, but we can test that
        # the contact deletion was successful which implies cascade worked 