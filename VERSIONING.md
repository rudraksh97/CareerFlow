# PATS Versioning System

This document describes the comprehensive versioning system implemented for the Personal Application Tracking System (PATS).

## Overview

PATS uses [Semantic Versioning](https://semver.org/) (SemVer) with a centralized version management system that ensures consistency across all project components.

**Current Version:** `1.0.0`

## Components

The versioning system manages versions across:

- ✅ **Backend API** (FastAPI application)
- ✅ **Frontend Application** (React/TypeScript)
- ✅ **Docker Images** (with metadata labels)
- ✅ **Git Tags** (for releases)
- ✅ **Package.json** (Node.js dependencies)
- ✅ **Centralized Configuration** (version.json)

## File Structure

```
PATS/
├── version.json                          # Central version configuration
├── scripts/
│   ├── version_manager.py               # Python version management tool
│   ├── version                          # Shell wrapper script
│   ├── docker-build.sh                 # Docker build with versioning
│   ├── setup-git-hooks.sh              # Git hooks installation
│   └── git-hooks/
│       └── pre-push                     # Version consistency checker
├── frontend/
│   ├── package.json                     # Node.js package version
│   └── src/utils/version.ts             # Frontend version utilities
└── backend/
    └── app/version.py                   # Backend version module
```

## Usage

### Quick Commands

```bash
# Show current version
./scripts/version current

# Bump patch version (1.0.0 → 1.0.1)
./scripts/version bump patch

# Bump minor version (1.0.0 → 1.1.0)
./scripts/version bump minor

# Bump major version (1.0.0 → 2.0.0)
./scripts/version bump major

# Set specific version
./scripts/version set 1.2.3

# Bump with changelog and git tag
./scripts/version bump patch --changes "Fixed bug in authentication" "Updated dependencies" --tag

# Build Docker images with version labels
./scripts/docker-build.sh all
```

### Version Manager Options

The `version_manager.py` script provides comprehensive version management:

```bash
# Basic usage
python3 scripts/version_manager.py [command] [options]

# Available commands
current              # Show current version
bump [type]          # Bump version (major|minor|patch)
set [version]        # Set specific version

# Options
--changes [list]     # Add changelog entries
--tag               # Create git tag
--tag-message       # Custom tag message
```

### Examples

#### Basic Version Bump
```bash
./scripts/version bump patch
# Updates: version.json, package.json, version.ts
# Output: ✓ Updated version.json: 1.0.0 → 1.0.1
```

#### Release with Changelog
```bash
./scripts/version bump minor \
  --changes "Added user authentication" "Fixed dashboard layout" "Updated API documentation" \
  --tag \
  --tag-message "Release v1.1.0 - Authentication Update"
```

#### Docker Build with Versioning
```bash
./scripts/docker-build.sh all
# Builds: pats-backend:1.0.0, pats-frontend:1.0.0
# Includes: version labels, build metadata, git information
```

## Version Display in UI

The system provides multiple ways to view version information:

### 1. **Minimalist Display**
- Appears in sidebar and footer
- Shows current version with hover tooltip
- Displays both frontend and backend versions

### 2. **Detailed View**
- Available in Settings page
- Shows complete version information:
  - Application version
  - Frontend/Backend versions
  - API version
  - Build information (commit hash, branch, build date)
  - Environment information

### 3. **API Endpoints**
```bash
# Basic version info
GET /
{
  "message": "Personal Application Tracking System API",
  "version": "1.0.0",
  "api_version": "v1"
}

# Detailed version info
GET /version
{
  "version": "1.0.0",
  "name": "Personal Application Tracking System (PATS)",
  "description": "A comprehensive system to track job applications and manage contacts",
  "api_version": "v1",
  "release_date": "2024-01-22",
  "build_info": {
    "commit_hash": "abc1234",
    "branch": "master",
    "build_date": "2024-01-22T10:30:00Z"
  },
  "environment": "development"
}
```

## Git Integration

### Git Hooks
Install git hooks for automatic version consistency checking:

```bash
./scripts/setup-git-hooks.sh
```

This installs a `pre-push` hook that:
- ✅ Checks version consistency across all files
- ❌ Prevents pushes with mismatched versions
- 💡 Provides helpful commands to fix issues

### Bypass Hooks
```bash
git push --no-verify  # Skip version checks
```

## Docker Integration

### Build Arguments
Docker images are built with version metadata:

```dockerfile
ARG VERSION="unknown"
ARG BUILD_DATE="unknown"
ARG COMMIT_HASH="unknown"
ARG BRANCH="unknown"
```

### Image Labels
Images include comprehensive metadata:
```dockerfile
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${COMMIT_HASH}"
LABEL pats.version="${VERSION}"
LABEL pats.component="backend|frontend"
```

### Inspect Images
```bash
docker image inspect pats-backend:latest --format='{{.Config.Labels}}'
```

## Configuration Files

### Central Configuration (`version.json`)
```json
{
  "version": "1.0.0",
  "name": "Personal Application Tracking System (PATS)",
  "description": "A comprehensive system to track job applications and manage contacts",
  "release_date": "2024-01-22",
  "changelog": [
    {
      "version": "1.0.0",
      "date": "2024-01-22",
      "changes": [
        "Initial release",
        "Job application tracking",
        "Contact management",
        "Analytics dashboard",
        "Resume and cover letter management"
      ]
    }
  ],
  "api_version": "v1",
  "build_info": {
    "build_date": "",
    "commit_hash": "",
    "branch": ""
  }
}
```

### Frontend Package (`package.json`)
- Automatically synced with central version
- Updated by version management scripts

### Frontend Version Utils (`src/utils/version.ts`)
- Provides version utilities for React components
- Fetches backend version information
- Handles environment detection

## Best Practices

### 1. **Semantic Versioning**
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### 2. **Release Process**
```bash
# 1. Make your changes
git add .
git commit -m "feat: add new authentication system"

# 2. Update version with changelog
./scripts/version bump minor \
  --changes "Added OAuth authentication" "Improved security" \
  --tag

# 3. Push changes and tags
git push
git push --tags

# 4. Build and deploy
./scripts/docker-build.sh all
```

### 3. **Development Workflow**
- Use `patch` for bug fixes
- Use `minor` for new features
- Use `major` for breaking changes
- Always add meaningful changelog entries
- Create git tags for releases

### 4. **Docker Workflow**
```bash
# Development
docker-compose up  # Uses local builds

# Production builds
./scripts/docker-build.sh all
docker tag pats-backend:1.0.0 registry/pats-backend:1.0.0
docker push registry/pats-backend:1.0.0
```

## Troubleshooting

### Version Mismatch
If git hooks prevent pushing due to version mismatch:

```bash
# Check current versions
./scripts/version current

# Sync all files to current version
./scripts/version set $(./scripts/version current | sed 's/Current version: //')

# Or bump to next version
./scripts/version bump patch
```

### Missing Version Files
If version.json is missing:

```bash
# Create with default version
./scripts/version set 1.0.0 --changes "Initial version setup"
```

### Docker Build Issues
```bash
# Check image labels
docker image inspect pats-backend:latest --format='{{.Config.Labels}}'

# Clean and rebuild
./scripts/docker-build.sh clean
./scripts/docker-build.sh all
```

## Future Enhancements

- [ ] Automatic version bumping on CI/CD
- [ ] Version API for external integrations
- [ ] Version history tracking in database
- [ ] Automated changelog generation from git commits
- [ ] Integration with package registries

---

For questions or issues, please refer to the main project documentation or create an issue in the repository. 