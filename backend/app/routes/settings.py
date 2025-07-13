from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import json
import tempfile
import requests

from ..models.database import get_db
from ..models.setting import Setting as SettingModel
from ..schemas import Setting, SettingCreate
from ..services.google_api_service import GoogleAPIService

router = APIRouter()

@router.get("/{key}", response_model=Setting)
def get_setting(key: str, db: Session = Depends(get_db)):
    """
    Get a specific setting by key.
    """
    db_setting = db.query(SettingModel).filter(SettingModel.key == key).first()
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting

@router.post("/", response_model=Setting)
def upsert_setting(setting: SettingCreate, db: Session = Depends(get_db)):
    """
    Create a new setting or update an existing one.
    """
    db_setting = db.query(SettingModel).filter(SettingModel.key == setting.key).first()
    if db_setting:
        # Update existing setting
        db_setting.value = setting.value
    else:
        # Create new setting
        db_setting = SettingModel(key=setting.key, value=setting.value)
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.post("/google/upload-credentials")
async def upload_google_credentials(
    credentials_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload Google OAuth2 credentials JSON file
    """
    try:
        # Validate file type
        if not credentials_file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Only JSON files are allowed")
        
        # Read and validate JSON content
        content = await credentials_file.read()
        try:
            credentials_data = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON file")
        
        # Validate required fields for OAuth2 credentials
        required_fields = ['client_id', 'client_secret', 'auth_uri', 'token_uri']
        if 'web' in credentials_data:
            web_creds = credentials_data['web']
            missing_fields = [field for field in required_fields if field not in web_creds]
        elif 'installed' in credentials_data:
            installed_creds = credentials_data['installed']
            missing_fields = [field for field in required_fields if field not in installed_creds]
        else:
            raise HTTPException(status_code=400, detail="Invalid credentials file format")
        
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Save credentials file
        credentials_dir = os.path.join(os.getcwd(), 'google_credentials')
        os.makedirs(credentials_dir, exist_ok=True)
        
        credentials_path = os.path.join(credentials_dir, 'credentials.json')
        with open(credentials_path, 'wb') as f:
            f.write(content)
        
        # Update setting
        db_setting = db.query(SettingModel).filter(SettingModel.key == "google_credentials_path").first()
        if db_setting:
            db_setting.value = credentials_path
        else:
            db_setting = SettingModel(key="google_credentials_path", value=credentials_path)
            db.add(db_setting)
        
        # Set default token path
        token_path = os.path.join(credentials_dir, 'token.json')
        token_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        if not token_setting:
            token_setting = SettingModel(key="google_token_path", value=token_path)
            db.add(token_setting)
        
        db.commit()
        
        return {
            "message": "Google credentials uploaded successfully",
            "credentials_path": credentials_path,
            "token_path": token_path
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload credentials: {str(e)}")

@router.post("/google/test-connection")
async def test_google_connection(db: Session = Depends(get_db)):
    """
    Test Google API connection with current credentials
    """
    try:
        # Get credentials path
        credentials_setting = db.query(SettingModel).filter(SettingModel.key == "google_credentials_path").first()
        token_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        
        if not credentials_setting:
            raise HTTPException(status_code=400, detail="Google credentials not configured")
        
        credentials_path = credentials_setting.value
        token_path = token_setting.value if token_setting else None
        
        # Test connection
        google_service = GoogleAPIService(credentials_path, token_path)
        
        if not google_service.authenticate():
            raise HTTPException(status_code=401, detail="Google authentication failed")
        
        connection_status = google_service.test_connection()
        
        return {
            "gmail_connected": connection_status.get('gmail', False),
            "calendar_connected": connection_status.get('calendar', False),
            "message": "Google API connection successful" if all(connection_status.values()) else "Partial connection"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")



@router.delete("/google/credentials")
async def delete_google_credentials(db: Session = Depends(get_db)):
    """
    Delete Google credentials and tokens
    """
    try:
        credentials_setting = db.query(SettingModel).filter(SettingModel.key == "google_credentials_path").first()
        token_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        
        files_deleted = []
        
        # Delete credentials file
        if credentials_setting and credentials_setting.value and os.path.exists(credentials_setting.value):
            os.remove(credentials_setting.value)
            files_deleted.append("credentials.json")
            db.delete(credentials_setting)
        
        # Delete token file
        if token_setting and token_setting.value and os.path.exists(token_setting.value):
            os.remove(token_setting.value)
            files_deleted.append("token.json")
            db.delete(token_setting)
        
        db.commit()
        
        return {
            "message": "Google credentials deleted successfully",
            "files_deleted": files_deleted
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete credentials: {str(e)}")

@router.post("/google/revoke-access")
async def revoke_google_access(db: Session = Depends(get_db)):
    """
    Revoke Google API access and delete tokens
    """
    try:
        token_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        
        if token_setting and token_setting.value and os.path.exists(token_setting.value):
            # Delete token file to revoke access
            os.remove(token_setting.value)
            
            return {
                "message": "Google access revoked successfully. You'll need to re-authenticate next time."
            }
        else:
            return {
                "message": "No active Google authentication found"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to revoke access: {str(e)}") 

@router.get("/auth/google/login")
def google_oauth_login():
    """
    Redirect user to Google OAuth consent screen
    """
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI")
    scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events openid email profile"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        f"scope={scope}&"
        "access_type=offline&"
        "prompt=consent"
    )
    return RedirectResponse(auth_url)

@router.get("/auth/google/callback")
def google_oauth_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback, exchange code for tokens, store them
    """
    code = request.query_params.get("code")
    if not code:
        return Response(content="Missing code in callback", status_code=400)
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI")
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    resp = requests.post(token_url, data=data)
    if resp.status_code != 200:
        return Response(content=f"Failed to get tokens: {resp.text}", status_code=400)
    tokens = resp.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    id_token = tokens.get("id_token")
    expires_in = tokens.get("expires_in")
    token_type = tokens.get("token_type")
    scope = tokens.get("scope")
    # Save to settings (in production, use a user-specific table)
    for key, value in [("google_access_token", access_token), ("google_refresh_token", refresh_token), ("google_id_token", id_token)]:
        if value:
            db_setting = db.query(SettingModel).filter(SettingModel.key == key).first()
            if db_setting:
                db_setting.value = value
            else:
                db_setting = SettingModel(key=key, value=value)
                db.add(db_setting)
    db.commit()

    # Create google_credentials directory and write token.json directly
    # No need for credentials.json, use environment variables
    credentials_dir = os.path.join(os.getcwd(), 'google_credentials')
    os.makedirs(credentials_dir, exist_ok=True)
    
    token_path = os.path.join(credentials_dir, 'token.json')
    
    # Create the token.json file in the format GoogleAPIService expects
    token_json = {
        "token": access_token,
        "refresh_token": refresh_token,
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": client_id,
        "client_secret": client_secret,
        "scopes": [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "openid",
            "email",
            "profile"
        ]
    }
    
    try:
        with open(token_path, "w") as f:
            json.dump(token_json, f)
        
        # Update settings to point to the token file
        token_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        if token_setting:
            token_setting.value = token_path
        else:
            token_setting = SettingModel(key="google_token_path", value=token_path)
            db.add(token_setting)
        
        # Set a dummy credentials path (not used but needed for compatibility)
        credentials_setting = db.query(SettingModel).filter(SettingModel.key == "google_credentials_path").first()
        if credentials_setting:
            credentials_setting.value = "oauth_flow"
        else:
            credentials_setting = SettingModel(key="google_credentials_path", value="oauth_flow")
            db.add(credentials_setting)
        
        db.commit()
        
        return Response(content="Google account connected successfully! You can close this window.", status_code=200)
        
    except Exception as e:
        return Response(content=f"Tokens saved to DB, but failed to write token.json: {str(e)}", status_code=500)

@router.get("/google/connect")
def get_google_connect_url():
    """
    Return the Google OAuth login URL for connecting an account.
    """
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI")
    scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events openid email profile"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        f"scope={scope}&"
        "access_type=offline&"
        "prompt=consent"
    )
    return {"auth_url": auth_url}

@router.get("/google/status")
def google_connection_status(db: Session = Depends(get_db)):
    """
    Return whether Google is connected and test both Gmail and Calendar access.
    """
    try:
        from ..services.google_api_service import GoogleAPIService
        
        token_setting = db.query(SettingModel).filter(SettingModel.key == "google_token_path").first()
        
        if not token_setting or not token_setting.value or not os.path.exists(token_setting.value):
            return {
                "google_connected": False,
                "gmail_connected": False,
                "calendar_connected": False,
                "message": "Google account not connected"
            }
        
        # Test actual API access
        google_service = GoogleAPIService(None, token_setting.value)
        if not google_service.authenticate():
            return {
                "google_connected": False,
                "gmail_connected": False,
                "calendar_connected": False,
                "message": "Google authentication failed"
            }
        
        # Test both services
        connection_status = google_service.test_connection()
        gmail_ok = connection_status.get('gmail', False)
        calendar_ok = connection_status.get('calendar', False)
        
        return {
            "google_connected": gmail_ok and calendar_ok,
            "gmail_connected": gmail_ok,
            "calendar_connected": calendar_ok,
            "message": "Both Gmail and Calendar connected" if (gmail_ok and calendar_ok) else 
                      "Gmail connected" if gmail_ok else 
                      "Calendar connected" if calendar_ok else 
                      "Authentication failed"
        }
        
    except Exception as e:
        return {
            "google_connected": False,
            "gmail_connected": False,
            "calendar_connected": False,
            "message": f"Status check failed: {str(e)}"
        } 