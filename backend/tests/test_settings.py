import pytest


class TestSettingsAPI:
    """Test suite for settings API endpoints"""

    def test_get_setting_success(self, client, create_test_setting):
        """Test getting a specific setting"""
        setting = create_test_setting(key="test_key", value="test_value")
        
        response = client.get(f"/api/settings/{setting.key}")
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == "test_key"
        assert result["value"] == "test_value"

    def test_get_setting_not_found(self, client):
        """Test getting non-existent setting"""
        response = client.get("/api/settings/non_existent_key")
        
        assert response.status_code == 404
        assert "Setting not found" in response.json()["detail"]

    def test_upsert_setting_create(self, client):
        """Test creating a new setting"""
        setting_data = {
            "key": "new_setting",
            "value": "new_value"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == "new_setting"
        assert result["value"] == "new_value"

    def test_upsert_setting_update(self, client, create_test_setting):
        """Test updating an existing setting"""
        setting = create_test_setting(key="existing_key", value="old_value")
        
        update_data = {
            "key": "existing_key",
            "value": "updated_value"
        }
        
        response = client.post("/api/settings/", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == "existing_key"
        assert result["value"] == "updated_value"

    def test_upsert_setting_missing_required_fields(self, client):
        """Test creating setting with missing required fields"""
        setting_data = {
            "key": "incomplete_setting"
            # Missing value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 422  # Validation error

    def test_upsert_setting_empty_value(self, client):
        """Test creating setting with empty value"""
        setting_data = {
            "key": "empty_setting",
            "value": ""
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == ""

    def test_upsert_setting_special_characters(self, client):
        """Test creating setting with special characters"""
        setting_data = {
            "key": "special_chars_setting",
            "value": "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == "!@#$%^&*()_+-=[]{}|;':\",./<>?"

    def test_upsert_setting_long_value(self, client):
        """Test creating setting with long value"""
        long_value = "x" * 1000
        setting_data = {
            "key": "long_setting",
            "value": long_value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == long_value

    def test_upsert_setting_json_value(self, client):
        """Test creating setting with JSON value"""
        json_value = '{"api_key": "test123", "enabled": true, "config": {"timeout": 30}}'
        setting_data = {
            "key": "json_setting",
            "value": json_value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == json_value

    def test_upsert_setting_unicode_value(self, client):
        """Test creating setting with unicode characters"""
        unicode_value = "测试设置值 🚀 émojis"
        setting_data = {
            "key": "unicode_setting",
            "value": unicode_value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == unicode_value

    def test_upsert_setting_case_sensitive_key(self, client):
        """Test that setting keys are case sensitive"""
        setting1_data = {
            "key": "CaseSensitive",
            "value": "value1"
        }
        setting2_data = {
            "key": "casesensitive",
            "value": "value2"
        }
        
        # Create first setting
        response1 = client.post("/api/settings/", json=setting1_data)
        assert response1.status_code == 200
        
        # Create second setting with different case
        response2 = client.post("/api/settings/", json=setting2_data)
        assert response2.status_code == 200
        
        # Verify they are different
        get1 = client.get("/api/settings/CaseSensitive")
        get2 = client.get("/api/settings/casesensitive")
        
        assert get1.status_code == 200
        assert get2.status_code == 200
        assert get1.json()["value"] == "value1"
        assert get2.json()["value"] == "value2"

    def test_upsert_setting_same_key_different_value(self, client):
        """Test updating setting with same key but different value"""
        # Create initial setting
        setting_data = {
            "key": "update_test",
            "value": "initial_value"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        assert response.status_code == 200
        assert response.json()["value"] == "initial_value"
        
        # Update with new value
        update_data = {
            "key": "update_test",
            "value": "updated_value"
        }
        
        response = client.post("/api/settings/", json=update_data)
        assert response.status_code == 200
        assert response.json()["value"] == "updated_value"
        
        # Verify the update
        get_response = client.get("/api/settings/update_test")
        assert get_response.status_code == 200
        assert get_response.json()["value"] == "updated_value"

    def test_upsert_setting_multiple_settings(self, client):
        """Test creating multiple settings"""
        settings = [
            {"key": "setting1", "value": "value1"},
            {"key": "setting2", "value": "value2"},
            {"key": "setting3", "value": "value3"}
        ]
        
        for setting_data in settings:
            response = client.post("/api/settings/", json=setting_data)
            assert response.status_code == 200
            result = response.json()
            assert result["key"] == setting_data["key"]
            assert result["value"] == setting_data["value"]
        
        # Verify all settings exist
        for setting_data in settings:
            get_response = client.get(f"/api/settings/{setting_data['key']}")
            assert get_response.status_code == 200
            assert get_response.json()["value"] == setting_data["value"]

    def test_upsert_setting_openai_api_key(self, client):
        """Test creating OpenAI API key setting"""
        setting_data = {
            "key": "openai_api_key",
            "value": "sk-test1234567890abcdef"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == "openai_api_key"
        assert result["value"] == "sk-test1234567890abcdef"

    def test_upsert_setting_email_config(self, client):
        """Test creating email configuration setting"""
        email_config = {
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "username": "user@example.com",
            "password": "password123",
            "use_tls": True
        }
        
        setting_data = {
            "key": "email_config",
            "value": str(email_config)
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == "email_config"

    def test_upsert_setting_boolean_value(self, client):
        """Test creating setting with boolean-like value"""
        setting_data = {
            "key": "feature_flag",
            "value": "true"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == "true"

    def test_upsert_setting_numeric_value(self, client):
        """Test creating setting with numeric value"""
        setting_data = {
            "key": "max_applications",
            "value": "100"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == "100"

    def test_upsert_setting_url_value(self, client):
        """Test creating setting with URL value"""
        setting_data = {
            "key": "webhook_url",
            "value": "https://api.example.com/webhook"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == "https://api.example.com/webhook"

    def test_upsert_setting_empty_key(self, client):
        """Test creating setting with empty key"""
        setting_data = {
            "key": "",
            "value": "some_value"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 422  # Validation error

    def test_upsert_setting_whitespace_key(self, client):
        """Test creating setting with whitespace-only key"""
        setting_data = {
            "key": "   ",
            "value": "some_value"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 422  # Validation error

    def test_upsert_setting_whitespace_value(self, client):
        """Test creating setting with whitespace-only value"""
        setting_data = {
            "key": "whitespace_value",
            "value": "   "
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == "   "

    def test_upsert_setting_special_key_characters(self, client):
        """Test creating setting with special characters in key"""
        setting_data = {
            "key": "setting_with_dots.and_underscores",
            "value": "test_value"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == "setting_with_dots.and_underscores"

    def test_upsert_setting_very_long_key(self, client):
        """Test creating setting with very long key"""
        long_key = "x" * 255  # Maximum reasonable length
        setting_data = {
            "key": long_key,
            "value": "test_value"
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["key"] == long_key

    def test_upsert_setting_very_long_value(self, client):
        """Test creating setting with very long value"""
        long_value = "x" * 10000  # Very long value
        setting_data = {
            "key": "long_value_setting",
            "value": long_value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == long_value

    def test_upsert_setting_newlines_in_value(self, client):
        """Test creating setting with newlines in value"""
        multiline_value = "line1\nline2\nline3"
        setting_data = {
            "key": "multiline_setting",
            "value": multiline_value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == multiline_value

    def test_upsert_setting_tabs_in_value(self, client):
        """Test creating setting with tabs in value"""
        tabbed_value = "field1\tfield2\tfield3"
        setting_data = {
            "key": "tabbed_setting",
            "value": tabbed_value
        }
        
        response = client.post("/api/settings/", json=setting_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["value"] == tabbed_value 