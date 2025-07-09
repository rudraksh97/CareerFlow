#!/usr/bin/env python3
"""
Version Manager for PATS project

This script helps manage versioning across the entire project,
including updating version.json, package.json, and creating git tags.
"""

import json
import os
import sys
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

PROJECT_ROOT = Path(__file__).parent.parent
VERSION_FILE = PROJECT_ROOT / "version.json"
FRONTEND_PACKAGE_JSON = PROJECT_ROOT / "frontend/package.json"
FRONTEND_VERSION_TS = PROJECT_ROOT / "frontend/src/utils/version.ts"

def load_json(file_path: Path) -> Dict:
    """Load JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(file_path: Path, data: Dict, indent: int = 2) -> None:
    """Save JSON file with proper formatting"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)

def parse_version(version: str) -> Tuple[int, int, int]:
    """Parse semantic version string into major, minor, patch"""
    match = re.match(r'^(\d+)\.(\d+)\.(\d+)$', version)
    if not match:
        raise ValueError(f"Invalid version format: {version}")
    return tuple(map(int, match.groups()))

def format_version(major: int, minor: int, patch: int) -> str:
    """Format version tuple into string"""
    return f"{major}.{minor}.{patch}"

def bump_version(version: str, bump_type: str) -> str:
    """Bump version based on type (major, minor, patch)"""
    major, minor, patch = parse_version(version)
    
    if bump_type == "major":
        return format_version(major + 1, 0, 0)
    elif bump_type == "minor":
        return format_version(major, minor + 1, 0)
    elif bump_type == "patch":
        return format_version(major, minor, patch + 1)
    else:
        raise ValueError(f"Invalid bump type: {bump_type}")

def get_git_info() -> Dict[str, str]:
    """Get current git information"""
    try:
        commit_hash = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
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
        return {
            "commit_hash": "unknown",
            "branch": "unknown",
            "build_date": datetime.utcnow().isoformat() + "Z"
        }

def update_version_json(new_version: str, changes: List[str]) -> None:
    """Update the central version.json file"""
    data = load_json(VERSION_FILE)
    old_version = data["version"]
    
    # Update version and release date
    data["version"] = new_version
    data["release_date"] = datetime.now().strftime("%Y-%m-%d")
    
    # Update build info
    data["build_info"] = get_git_info()
    
    # Add changelog entry
    changelog_entry = {
        "version": new_version,
        "date": data["release_date"],
        "changes": changes
    }
    data["changelog"].insert(0, changelog_entry)
    
    save_json(VERSION_FILE, data)
    print(f"✓ Updated version.json: {old_version} → {new_version}")

def update_frontend_package_json(new_version: str) -> None:
    """Update frontend package.json version"""
    data = load_json(FRONTEND_PACKAGE_JSON)
    old_version = data["version"]
    data["version"] = new_version
    save_json(FRONTEND_PACKAGE_JSON, data)
    print(f"✓ Updated frontend/package.json: {old_version} → {new_version}")

def update_frontend_version_ts(new_version: str) -> None:
    """Update frontend version.ts file"""
    with open(FRONTEND_VERSION_TS, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update the FRONTEND_VERSION constant
    new_content = re.sub(
        r'export const FRONTEND_VERSION = "[^"]+";',
        f'export const FRONTEND_VERSION = "{new_version}";',
        content
    )
    
    with open(FRONTEND_VERSION_TS, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✓ Updated frontend/src/utils/version.ts")

def create_git_tag(version: str, message: str = None) -> None:
    """Create a git tag for the version"""
    try:
        tag_name = f"v{version}"
        tag_message = message or f"Release version {version}"
        
        subprocess.run([
            'git', 'tag', '-a', tag_name, '-m', tag_message
        ], cwd=PROJECT_ROOT, check=True)
        
        print(f"✓ Created git tag: {tag_name}")
        print(f"  To push the tag: git push origin {tag_name}")
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to create git tag: {e}")

def get_current_version() -> str:
    """Get current version from version.json"""
    try:
        data = load_json(VERSION_FILE)
        return data["version"]
    except (FileNotFoundError, KeyError):
        return "1.0.0"

def main():
    """Main CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PATS Version Manager")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Current version command
    current_parser = subparsers.add_parser('current', help='Show current version')
    
    # Bump version command
    bump_parser = subparsers.add_parser('bump', help='Bump version')
    bump_parser.add_argument('type', choices=['major', 'minor', 'patch'], 
                           help='Type of version bump')
    bump_parser.add_argument('--changes', nargs='+', 
                           help='List of changes for changelog')
    bump_parser.add_argument('--tag', action='store_true',
                           help='Create git tag after bumping')
    bump_parser.add_argument('--tag-message',
                           help='Custom message for git tag')
    
    # Set version command
    set_parser = subparsers.add_parser('set', help='Set specific version')
    set_parser.add_argument('version', help='Version to set (e.g., 1.2.3)')
    set_parser.add_argument('--changes', nargs='+',
                          help='List of changes for changelog')
    set_parser.add_argument('--tag', action='store_true',
                          help='Create git tag after setting version')
    set_parser.add_argument('--tag-message',
                          help='Custom message for git tag')
    
    args = parser.parse_args()
    
    if args.command == 'current':
        print(f"Current version: {get_current_version()}")
        
    elif args.command == 'bump':
        current_version = get_current_version()
        new_version = bump_version(current_version, args.type)
        changes = args.changes or [f"{args.type.capitalize()} version bump"]
        
        print(f"Bumping version: {current_version} → {new_version}")
        
        # Update all version files
        update_version_json(new_version, changes)
        update_frontend_package_json(new_version)
        update_frontend_version_ts(new_version)
        
        if args.tag:
            create_git_tag(new_version, args.tag_message)
            
    elif args.command == 'set':
        # Validate version format
        parse_version(args.version)
        
        current_version = get_current_version()
        changes = args.changes or [f"Version set to {args.version}"]
        
        print(f"Setting version: {current_version} → {args.version}")
        
        # Update all version files
        update_version_json(args.version, changes)
        update_frontend_package_json(args.version)
        update_frontend_version_ts(args.version)
        
        if args.tag:
            create_git_tag(args.version, args.tag_message)
            
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 