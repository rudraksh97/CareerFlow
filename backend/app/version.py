import json
import os
from pathlib import Path
from datetime import datetime
import subprocess
from typing import Dict, Any

# Get the path to the project root (two levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent.parent

def load_version_config() -> Dict[str, Any]:
    """Load version configuration from version.json"""
    version_file = PROJECT_ROOT / "version.json"
    try:
        with open(version_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback to default version if file doesn't exist
        return {
            "version": "1.0.0",
            "name": "Personal Application Tracking System (PATS)",
            "description": "A comprehensive system to track job applications and manage contacts",
            "api_version": "v1"
        }

def get_git_info() -> Dict[str, str]:
    """Get current git information"""
    try:
        # Get current commit hash
        commit_hash = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        # Get current branch
        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        return {
            "commit_hash": commit_hash,
            "branch": branch,
            "build_date": datetime.utcnow().isoformat() + "Z"
        }
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Git not available or not in a git repository
        return {
            "commit_hash": "unknown",
            "branch": "unknown",
            "build_date": datetime.utcnow().isoformat() + "Z"
        }

def get_version_info() -> Dict[str, Any]:
    """Get complete version information"""
    config = load_version_config()
    git_info = get_git_info()
    
    return {
        "version": config.get("version", "1.0.0"),
        "name": config.get("name", "PATS"),
        "description": config.get("description", ""),
        "api_version": config.get("api_version", "v1"),
        "release_date": config.get("release_date", ""),
        "build_info": git_info,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Cache version info on module import
VERSION_INFO = get_version_info()
VERSION = VERSION_INFO["version"]
API_VERSION = VERSION_INFO["api_version"] 