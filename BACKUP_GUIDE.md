# PATS Backup & Restore System

This document describes the comprehensive backup and restore system for the PATS (Personal Application Tracking System) project.

## Overview

The backup system provides:
- **Database persistence** - SQLite database with volume mounting
- **File persistence** - User uploads and application files
- **Schema migration handling** - Automatic Alembic revision tracking
- **Easy recovery** - Simple commands for backup/restore operations
- **Automated backups** - Integration with development workflow

## Data Persistence

### Volume Mounts
The following directories are mounted as volumes to ensure data persists across container restarts:

```yaml
volumes:
  - ./backend/data:/app/data          # Database storage
  - ./backend/uploads:/app/uploads    # User file uploads
  - ./backups:/app/backups           # Backup storage
```

### File Locations
- **Database**: `./backend/data/pats.db`
- **Uploads**: `./backend/uploads/`
- **Backups**: `./backups/`

## Quick Start

### Create a Backup
```bash
# Simple backup with auto-generated name
./backup.sh backup

# Named backup
./backup.sh backup pre_migration_v2

# Automated backup with git info
./backup.sh auto-backup
```

### List Backups
```bash
./backup.sh list
```

### Restore from Backup
```bash
# Interactive restore (asks for confirmation)
./backup.sh restore backup_20241201_120000

# Force restore (no confirmation)
./backup.sh restore backup_20241201_120000 --force
```

## Backup System Features

### 1. Complete Data Backup
Each backup includes:
- **Database file** (`pats.db`)
- **Uploads directory** (all user files)
- **Metadata file** with backup information

### 2. Schema Migration Tracking
- Records current Alembic revision
- Detects schema mismatches during restore
- Provides migration commands when needed

### 3. Safe Restore Process
- Creates backup of current data before restore
- Confirms restore operations (unless `--force` used)
- Provides clear status messages

### 4. Metadata Tracking
Each backup includes a `backup_metadata.json` file:
```json
{
  "backup_name": "backup_20241201_120000",
  "timestamp": "20241201_120000",
  "created_at": "2024-12-01T12:00:00.000000",
  "alembic_revision": "041bd0560732",
  "database_file": "pats.db",
  "uploads_included": true,
  "backup_version": "1.0"
}
```

## Command Reference

### Using the Shell Script (Recommended)

#### Basic Commands
```bash
./backup.sh backup [name]              # Create backup
./backup.sh list                       # List all backups
./backup.sh restore <name> [--force]   # Restore from backup
./backup.sh auto-backup                # Create auto backup with git info
```

#### Database Dumps
```bash
./backup.sh dump [filename]            # Create SQL dump
./backup.sh restore-dump <filename>    # Restore from SQL dump
```

### Using Python Script Directly
```bash
# Inside container
docker-compose exec backend python backup_restore.py <command>

# Examples
docker-compose exec backend python backup_restore.py backup
docker-compose exec backend python backup_restore.py list
docker-compose exec backend python backup_restore.py restore backup_20241201_120000
```

## Migration Workflow

### Before Making Schema Changes
```bash
# 1. Create backup before changes
./backup.sh backup pre_migration_$(date +%Y%m%d)

# 2. Make your model changes
# ... edit your models ...

# 3. Create migration
docker-compose exec backend bash -c "cd /app && alembic revision --autogenerate -m 'Your changes'"

# 4. Apply migration
docker-compose exec backend bash -c "cd /app && alembic upgrade head"
```

### If Migration Fails
```bash
# Restore to pre-migration state
./backup.sh restore pre_migration_20241201

# Fix your models and try again
```

## Recovery Scenarios

### 1. Container Deleted
Since data is volume-mounted, simply restart:
```bash
docker-compose up -d
```
All data will be preserved.

### 2. Database Corruption
```bash
# Restore from recent backup
./backup.sh list
./backup.sh restore backup_20241201_120000
```

### 3. Schema Migration Issues
```bash
# Restore backup and sync schema
./backup.sh restore backup_20241201_120000

# Follow the migration sync commands shown after restore
docker-compose exec backend bash -c "cd /app && alembic stamp 041bd0560732"
docker-compose exec backend bash -c "cd /app && alembic upgrade head"
```

### 4. File System Issues
```bash
# Create SQL dump for database-only recovery
./backup.sh dump emergency_dump.sql

# Later restore just the database
./backup.sh restore-dump emergency_dump.sql
```

## Best Practices

### 1. Regular Backups
- Create backups before major changes
- Use `auto-backup` for development workflow
- Schedule regular backups in production

### 2. Backup Naming
- Use descriptive names: `pre_migration_v2`, `before_refactor`
- Include dates for easy identification
- Use `auto-backup` to include git commit info

### 3. Testing Restores
- Periodically test restore process
- Verify data integrity after restore
- Check that migrations work correctly

### 4. Storage Management
- Monitor backup directory size
- Clean up old backups periodically
- Consider external backup storage for production

## Troubleshooting

### Container Not Running
```bash
# Start services
docker-compose up -d

# Check container status
docker ps
```

### Permission Issues
```bash
# Fix permissions for backup script
chmod +x backup.sh

# Fix permissions for backup directory
sudo chown -R $USER:$USER backups/
```

### Database Lock Issues
```bash
# Stop services before restore
docker-compose down

# Restore
./backup.sh restore backup_name --force

# Start services
docker-compose up -d
```

### Schema Mismatch
When restoring a backup with different schema:
1. Backup will show current vs backup revision
2. Use provided `alembic stamp` command to sync
3. Run `alembic upgrade head` to apply latest migrations

## File Structure

```
PATS/
├── backend/
│   ├── data/
│   │   └── pats.db                    # Main database
│   ├── uploads/                       # User file uploads
│   ├── backup_restore.py              # Backup system
│   └── alembic/                       # Migration files
├── backups/                           # Backup storage
│   ├── backup_20241201_120000/
│   │   ├── pats.db                    # Backed up database
│   │   ├── uploads/                   # Backed up files
│   │   └── backup_metadata.json      # Backup info
│   └── database_dump_20241201.sql    # SQL dumps
├── backup.sh                         # Backup helper script
└── BACKUP_GUIDE.md                   # This guide
```

## Security Notes

- Backups contain sensitive application data
- Secure backup storage location appropriately
- Consider encryption for production backups
- Limit access to backup files
- Regular backup verification recommended

## Support

For issues with the backup system:
1. Check container logs: `docker-compose logs backend`
2. Verify file permissions
3. Ensure sufficient disk space
4. Test with a simple backup/restore cycle 