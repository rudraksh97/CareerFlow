#!/bin/bash

# PATS Backup & Restore Helper Script
# Run from the project root directory

set -e

BACKEND_CONTAINER="pats-backend-1"

# Function to check if container is running
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${BACKEND_CONTAINER}$"; then
        echo "Error: Backend container '${BACKEND_CONTAINER}' is not running"
        echo "Please start the services with: docker-compose up -d"
        exit 1
    fi
}

# Function to display help
show_help() {
    echo "PATS Backup & Restore Helper"
    echo "Usage: ./backup.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  backup [name]              - Create a backup"
    echo "  list                       - List all backups"
    echo "  restore <name> [--force]   - Restore from backup"
    echo "  dump [filename]            - Create SQL dump"
    echo "  restore-dump <filename>    - Restore from SQL dump"
    echo "  auto-backup                - Create automated backup with migration info"
    echo ""
    echo "Examples:"
    echo "  ./backup.sh backup"
    echo "  ./backup.sh backup pre_migration_v2"
    echo "  ./backup.sh list"
    echo "  ./backup.sh restore backup_20241201_120000"
    echo "  ./backup.sh auto-backup"
    echo ""
    echo "Data persistence:"
    echo "  - Database: ./backend/data/pats.db"
    echo "  - Uploads: ./backend/uploads/"
    echo "  - Backups: ./backups/"
}

# Function to create an automated backup before migrations
auto_backup() {
    echo "Creating automated backup before potential migration..."
    
    # Get current git commit if available
    GIT_COMMIT=""
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    fi
    
    # Create backup name with timestamp and git info
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    if [ -n "$GIT_COMMIT" ]; then
        BACKUP_NAME="auto_${TIMESTAMP}_${GIT_COMMIT}"
    else
        BACKUP_NAME="auto_${TIMESTAMP}"
    fi
    
    echo "Backup name: $BACKUP_NAME"
    docker exec $BACKEND_CONTAINER python backup_restore.py backup "$BACKUP_NAME"
    
    echo ""
    echo "✓ Automated backup completed!"
    echo "  Name: $BACKUP_NAME"
    echo "  Location: ./backups/$BACKUP_NAME"
    echo ""
    echo "This backup can be restored later with:"
    echo "  ./backup.sh restore $BACKUP_NAME"
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Parse command line arguments
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

COMMAND="$1"
shift

case "$COMMAND" in
    "backup")
        check_container
        if [ $# -gt 0 ]; then
            docker exec $BACKEND_CONTAINER python backup_restore.py backup "$1"
        else
            docker exec $BACKEND_CONTAINER python backup_restore.py backup
        fi
        ;;
    
    "list")
        check_container
        docker exec $BACKEND_CONTAINER python backup_restore.py list
        ;;
    
    "restore")
        check_container
        if [ $# -eq 0 ]; then
            echo "Error: Backup name required"
            echo "Use './backup.sh list' to see available backups"
            exit 1
        fi
        
        BACKUP_NAME="$1"
        FORCE_FLAG=""
        if [ "$2" == "--force" ]; then
            FORCE_FLAG="--force"
        fi
        
        docker exec $BACKEND_CONTAINER python backup_restore.py restore "$BACKUP_NAME" $FORCE_FLAG
        ;;
    
    "dump")
        check_container
        if [ $# -gt 0 ]; then
            docker exec $BACKEND_CONTAINER python backup_restore.py dump "$1"
        else
            docker exec $BACKEND_CONTAINER python backup_restore.py dump
        fi
        ;;
    
    "restore-dump")
        check_container
        if [ $# -eq 0 ]; then
            echo "Error: Dump filename required"
            exit 1
        fi
        docker exec $BACKEND_CONTAINER python backup_restore.py restore-dump "$1"
        ;;
    
    "auto-backup")
        check_container
        auto_backup
        ;;
    
    "help" | "--help" | "-h")
        show_help
        ;;
    
    *)
        echo "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac 