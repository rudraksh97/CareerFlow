import pytest


class TestProfileAPI:
    """Test suite for profile API endpoints"""

    def test_get_profile_empty(self, client):
        """Test getting profile when none exists"""
        response = client.get("/api/profile/")
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == 1
        assert result["full_name"] == ""
        assert result["email"] is None
        assert result["headline"] == ""
        assert result["linkedin_url"] is None

    def test_get_profile_with_data(self, client, create_test_profile):
        """Test getting profile with existing data"""
        profile = create_test_profile(
            full_name="John Doe",
            email="john.doe@example.com",
            headline="Software Engineer",
            linkedin_url="https://linkedin.com/in/johndoe"
        )
        
        response = client.get("/api/profile/")
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == 1
        assert result["full_name"] == "John Doe"
        assert result["email"] == "john.doe@example.com"
        assert result["headline"] == "Software Engineer"
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"

    def test_upsert_profile_create(self, client):
        """Test creating a new profile"""
        profile_data = {
            "full_name": "Jane Smith",
            "email": "jane.smith@example.com",
            "headline": "Senior Developer",
            "linkedin_url": "https://linkedin.com/in/janesmith"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == 1
        assert result["full_name"] == "Jane Smith"
        assert result["email"] == "jane.smith@example.com"
        assert result["headline"] == "Senior Developer"
        assert result["linkedin_url"] == "https://linkedin.com/in/janesmith"

    def test_upsert_profile_update(self, client, create_test_profile):
        """Test updating an existing profile"""
        profile = create_test_profile(
            full_name="Old Name",
            email="old@example.com",
            headline="Old Title"
        )
        
        update_data = {
            "full_name": "Updated Name",
            "email": "updated@example.com",
            "headline": "Updated Title",
            "linkedin_url": "https://linkedin.com/in/updated"
        }
        
        response = client.post("/api/profile/", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == 1
        assert result["full_name"] == "Updated Name"
        assert result["email"] == "updated@example.com"
        assert result["headline"] == "Updated Title"
        assert result["linkedin_url"] == "https://linkedin.com/in/updated"

    def test_upsert_profile_partial_update(self, client, create_test_profile):
        """Test updating only some profile fields"""
        profile = create_test_profile(
            full_name="John Doe",
            email="john@example.com",
            headline="Developer",
            linkedin_url="https://linkedin.com/in/johndoe"
        )
        
        update_data = {
            "headline": "Senior Developer"
        }
        
        response = client.post("/api/profile/", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == 1
        assert result["full_name"] == "John Doe"  # Unchanged
        assert result["email"] == "john@example.com"  # Unchanged
        assert result["headline"] == "Senior Developer"  # Updated
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"  # Unchanged

    def test_upsert_profile_empty_fields(self, client):
        """Test creating profile with empty fields"""
        profile_data = {
            "full_name": "",
            "email": None,
            "headline": "",
            "linkedin_url": None
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == 1
        assert result["full_name"] == ""
        assert result["email"] is None
        assert result["headline"] == ""
        assert result["linkedin_url"] is None

    def test_upsert_profile_invalid_email(self, client):
        """Test creating profile with invalid email format"""
        profile_data = {
            "full_name": "John Doe",
            "email": "invalid-email",
            "headline": "Developer"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 422

    def test_upsert_profile_invalid_linkedin_url(self, client):
        """Test creating profile with invalid LinkedIn URL"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Developer",
            "linkedin_url": "not-a-valid-url"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 422  # Validation error

    def test_upsert_profile_valid_linkedin_urls(self, client):
        """Test creating profile with various valid LinkedIn URL formats"""
        valid_urls = [
            "https://linkedin.com/in/johndoe",
            "https://www.linkedin.com/in/jane-smith",
            "https://linkedin.com/in/john_doe_123",
            "https://www.linkedin.com/in/john-doe-123456789"
        ]
        
        for i, url in enumerate(valid_urls):
            profile_data = {
                "full_name": f"User {i}",
                "email": f"user{i}@example.com",
                "headline": f"Developer {i}",
                "linkedin_url": url
            }
            
            response = client.post("/api/profile/", json=profile_data)
            assert response.status_code == 200
            result = response.json()
            assert result["linkedin_url"] == url

    def test_upsert_profile_special_characters(self, client):
        """Test creating profile with special characters"""
        profile_data = {
            "full_name": "José María O'Connor-Smith",
            "email": "jose.maria@example.com",
            "headline": "Senior Software Engineer 🚀",
            "linkedin_url": "https://linkedin.com/in/jose-maria"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["full_name"] == "José María O'Connor-Smith"
        assert result["email"] == "jose.maria@example.com"
        assert result["headline"] == "Senior Software Engineer 🚀"
        assert result["linkedin_url"] == "https://linkedin.com/in/jose-maria"

    def test_upsert_profile_long_fields(self, client):
        """Test creating profile with long field values"""
        long_name = "A" * 100
        long_headline = "B" * 200
        
        profile_data = {
            "full_name": long_name,
            "email": "long@example.com",
            "headline": long_headline,
            "linkedin_url": "https://linkedin.com/in/longuser"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["full_name"] == long_name
        assert result["headline"] == long_headline

    def test_upsert_profile_whitespace_handling(self, client):
        """Test profile creation with whitespace handling"""
        profile_data = {
            "full_name": "  John Doe  ",
            "email": "  john@example.com  ",
            "headline": "  Developer  ",
            "linkedin_url": "  https://linkedin.com/in/johndoe  "
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        # Note: The actual behavior depends on how the backend handles whitespace
        # This test documents the current behavior
        assert result["full_name"] == "  John Doe  "
        assert result["email"] == "john@example.com"
        assert result["headline"] == "  Developer  "
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"

    def test_upsert_profile_case_sensitivity(self, client):
        """Test that profile fields handle case sensitivity correctly"""
        profile_data = {
            "full_name": "John Doe",
            "email": "JOHN@EXAMPLE.COM",
            "headline": "DEVELOPER",
            "linkedin_url": "https://www.linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["full_name"] == "John Doe"
        assert result["email"] == "JOHN@example.com"
        assert result["headline"] == "DEVELOPER"
        assert result["linkedin_url"] == "https://www.linkedin.com/in/johndoe"

    def test_upsert_profile_numeric_headline(self, client):
        """Test that a numeric headline is handled correctly"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "123 Developer",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "123 Developer"

    def test_upsert_profile_symbols_in_headline(self, client):
        """Test profile creation with symbols in headline"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Full-Stack Developer (React/Node.js) & DevOps Engineer",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "Full-Stack Developer (React/Node.js) & DevOps Engineer"

    def test_upsert_profile_multiple_updates(self, client):
        """Test multiple profile updates"""
        # Initial creation
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Junior Developer"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "Junior Developer"
        
        # First update
        update1 = {
            "headline": "Mid-level Developer",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=update1)
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "Mid-level Developer"
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"
        
        # Second update
        update2 = {
            "headline": "Senior Developer",
            "email": "john.doe@company.com"
        }
        
        response = client.post("/api/profile/", json=update2)
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "Senior Developer"
        assert result["email"] == "john.doe@company.com"
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"  # Should persist

    def test_upsert_profile_clear_linkedin_url(self, client, create_test_profile):
        """Test clearing LinkedIn URL by setting it to null"""
        profile = create_test_profile(
            full_name="John Doe",
            email="john@example.com",
            headline="Developer",
            linkedin_url="https://linkedin.com/in/johndoe"
        )
        
        update_data = {
            "linkedin_url": None
        }
        
        response = client.post("/api/profile/", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["linkedin_url"] is None

    def test_upsert_profile_empty_string_linkedin_url(self, client):
        """Test that an empty string for linkedin_url is handled correctly"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Developer",
            "linkedin_url": "",
        }
        response = client.post("/api/profile/", json=profile_data)
        assert response.status_code == 422

    def test_upsert_profile_missing_optional_fields(self, client):
        """Test creating profile with only required fields"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com"
            # Missing headline and linkedin_url
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["full_name"] == "John Doe"
        assert result["email"] == "john@example.com"
        assert result["headline"] is None
        assert result["linkedin_url"] is None

    def test_upsert_profile_all_optional_fields(self, client):
        """Test creating profile with all optional fields"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Software Engineer",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["full_name"] == "John Doe"
        assert result["email"] == "john@example.com"
        assert result["headline"] == "Software Engineer"
        assert result["linkedin_url"] == "https://linkedin.com/in/johndoe"

    def test_upsert_profile_very_long_linkedin_url(self, client):
        """Test profile creation with very long LinkedIn URL"""
        long_url = "https://linkedin.com/in/" + "a" * 100
        
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Developer",
            "linkedin_url": long_url
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["linkedin_url"] == long_url

    def test_upsert_profile_newlines_in_headline(self, client):
        """Test profile creation with newlines in headline"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Software Engineer\nFull Stack Developer\nDevOps Specialist",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "Software Engineer\nFull Stack Developer\nDevOps Specialist"

    def test_upsert_profile_tabs_in_headline(self, client):
        """Test profile creation with tabs in headline"""
        profile_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "headline": "Software Engineer\tFull Stack Developer\tDevOps Specialist",
            "linkedin_url": "https://linkedin.com/in/johndoe"
        }
        
        response = client.post("/api/profile/", json=profile_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["headline"] == "Software Engineer\tFull Stack Developer\tDevOps Specialist" 