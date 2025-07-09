#!/bin/bash

# PATS Backup System Demonstration
# This script demonstrates all backup and restore capabilities

set -e

echo "🚀 PATS Backup & Restore System Demonstration"
echo "=============================================="
echo ""

# Check if services are running
if ! docker ps --format "table {{.Names}}" | grep -q "pats-backend-1"; then
    echo "⚠️  Starting Docker services..."
    docker-compose up -d
    echo "✅ Services started"
    echo ""
fi

echo "📊 Current System Status:"
echo "-------------------------"
echo "🗄️  Database: $(ls -la backend/data/pats.db 2>/dev/null && echo "✅ Present" || echo "❌ Missing")"
echo "📁 Uploads: $(ls -d backend/uploads 2>/dev/null && echo "✅ Present" || echo "❌ Missing")"
echo "🔄 Alembic: $(docker-compose exec -T backend bash -c "cd /app && alembic current" 2>/dev/null | grep -v INFO | head -1 || echo "Not initialized")"
echo ""

echo "1️⃣  Creating a named backup..."
./backup.sh backup demo_backup_$(date +%Y%m%d_%H%M%S)
echo ""

echo "2️⃣  Creating an automated backup with git info..."
./backup.sh auto-backup
echo ""

echo "3️⃣  Creating a SQL dump..."
./backup.sh dump demo_dump_$(date +%Y%m%d_%H%M%S).sql
echo ""

echo "4️⃣  Listing all available backups:"
echo "-----------------------------------"
./backup.sh list
echo ""

echo "5️⃣  Checking backup files on disk:"
echo "-----------------------------------"
echo "📂 Backup directory contents:"
ls -la backups/ | head -10
echo ""

if [ -d "backups" ] && [ "$(ls -A backups/)" ]; then
    LATEST_BACKUP=$(ls -t backups/ | head -1)
    echo "📋 Latest backup structure:"
    echo "   📁 $LATEST_BACKUP/"
    ls -la "backups/$LATEST_BACKUP/" 2>/dev/null || echo "   (Could not read backup structure)"
    echo ""
    
    if [ -f "backups/$LATEST_BACKUP/backup_metadata.json" ]; then
        echo "📄 Backup metadata:"
        cat "backups/$LATEST_BACKUP/backup_metadata.json" | python -m json.tool 2>/dev/null || cat "backups/$LATEST_BACKUP/backup_metadata.json"
        echo ""
    fi
fi

echo "✅ Backup System Demonstration Complete!"
echo ""
echo "🎯 Key Features Demonstrated:"
echo "   • ✅ Volume-mounted data persistence"
echo "   • ✅ Complete database backups"
echo "   • ✅ File upload backups"
echo "   • ✅ Alembic schema revision tracking"
echo "   • ✅ Automated backup naming with git info"
echo "   • ✅ SQL dump creation"
echo "   • ✅ Comprehensive metadata tracking"
echo ""
echo "🔧 Usage Examples:"
echo "   ./backup.sh backup [name]          # Create backup"
echo "   ./backup.sh list                   # List backups"
echo "   ./backup.sh restore <name>         # Restore backup"
echo "   ./backup.sh auto-backup            # Auto backup"
echo ""
echo "📖 For full documentation, see: BACKUP_GUIDE.md" 