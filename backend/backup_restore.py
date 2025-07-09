#!/usr/bin/env python3
"""
Backup and Restore System for PATS Application
Handles database backups, file backups, and schema migrations
"""

import os
import sys
import json
import shutil
import sqlite3
import subprocess
import datetime
from pathlib import Path
from typing import Dict, Any, Optional

class PATSBackupRestore:
    def __init__(self):
        self.base_dir = Path("/app")
        self.backup_dir = Path("/app/backups")
        self.data_dir = Path("/app/data")
        self.uploads_dir = Path("/app/uploads")
        self.db_path = Path("/app/data/pats.db")
        
        # Ensure backup directory exists
        self.backup_dir.mkdir(exist_ok=True)
    
    def get_timestamp(self) -> str:
        """Get current timestamp for backup naming"""
        return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def get_alembic_revision(self) -> Optional[str]:
        """Get current Alembic revision"""
        try:
            os.chdir(self.base_dir)
            result = subprocess.run(
                ["alembic", "current"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                # Extract revision from output
                for line in result.stdout.split('\n'):
                    line = line.strip()
                    # Look for pattern like "041bd0560732 (head)" or just "041bd0560732"
                    if line and not line.startswith('INFO'):
                        # Extract the revision ID (first 12 characters)
                        revision = line.split()[0]
                        if len(revision) == 12 and revision.isalnum():
                            return revision
            return None
        except Exception as e:
            print(f"Error getting Alembic revision: {e}")
            return None
    
    def create_backup(self, backup_name: Optional[str] = None) -> str:
        """Create a complete backup of database and uploads"""
        timestamp = self.get_timestamp()
        if not backup_name:
            backup_name = f"backup_{timestamp}"
        
        backup_path = self.backup_dir / backup_name
        backup_path.mkdir(exist_ok=True)
        
        print(f"Creating backup: {backup_name}")
        
        # 1. Backup database
        if self.db_path.exists():
            db_backup_path = backup_path / "pats.db"
            shutil.copy2(self.db_path, db_backup_path)
            print(f"✓ Database backed up to {db_backup_path}")
        else:
            print("⚠ Database file not found")
        
        # 2. Backup uploads directory
        if self.uploads_dir.exists():
            uploads_backup_path = backup_path / "uploads"
            shutil.copytree(self.uploads_dir, uploads_backup_path, dirs_exist_ok=True)
            print(f"✓ Uploads backed up to {uploads_backup_path}")
        else:
            print("⚠ Uploads directory not found")
        
        # 3. Get current Alembic revision
        current_revision = self.get_alembic_revision()
        
        # 4. Create metadata file
        metadata = {
            "backup_name": backup_name,
            "timestamp": timestamp,
            "created_at": datetime.datetime.now().isoformat(),
            "alembic_revision": current_revision,
            "database_file": "pats.db" if self.db_path.exists() else None,
            "uploads_included": self.uploads_dir.exists(),
            "backup_version": "1.0"
        }
        
        metadata_path = backup_path / "backup_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✓ Backup metadata saved")
        print(f"✓ Backup completed: {backup_path}")
        print(f"  - Alembic revision: {current_revision}")
        
        return backup_name
    
    def list_backups(self) -> list:
        """List all available backups"""
        backups = []
        for item in self.backup_dir.iterdir():
            if item.is_dir():
                metadata_file = item / "backup_metadata.json"
                if metadata_file.exists():
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                        backups.append({
                            "name": item.name,
                            "path": str(item),
                            "metadata": metadata
                        })
                    except Exception as e:
                        print(f"Error reading metadata for {item.name}: {e}")
        
        return sorted(backups, key=lambda x: x["metadata"].get("created_at", ""))
    
    def restore_backup(self, backup_name: str, force: bool = False) -> bool:
        """Restore from a backup"""
        backup_path = self.backup_dir / backup_name
        
        if not backup_path.exists():
            print(f"Error: Backup '{backup_name}' not found")
            return False
        
        metadata_file = backup_path / "backup_metadata.json"
        if not metadata_file.exists():
            print(f"Error: Backup metadata not found for '{backup_name}'")
            return False
        
        # Load backup metadata
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        print(f"Restoring backup: {backup_name}")
        print(f"Created: {metadata.get('created_at')}")
        print(f"Alembic revision: {metadata.get('alembic_revision')}")
        
        if not force:
            confirm = input("Are you sure you want to restore? This will overwrite current data. (y/N): ")
            if confirm.lower() != 'y':
                print("Restore cancelled")
                return False
        
        # 1. Restore database
        db_backup_path = backup_path / "pats.db"
        if db_backup_path.exists():
            # Create backup of current database first
            if self.db_path.exists():
                current_backup = self.db_path.with_suffix(f".db.pre_restore_{self.get_timestamp()}")
                shutil.copy2(self.db_path, current_backup)
                print(f"✓ Current database backed up to {current_backup}")
            
            # Ensure data directory exists
            self.data_dir.mkdir(exist_ok=True)
            shutil.copy2(db_backup_path, self.db_path)
            print(f"✓ Database restored")
        
        # 2. Restore uploads
        uploads_backup_path = backup_path / "uploads"
        if uploads_backup_path.exists():
            # Backup current uploads if they exist
            if self.uploads_dir.exists():
                current_uploads_backup = self.uploads_dir.with_name(f"uploads_pre_restore_{self.get_timestamp()}")
                shutil.move(self.uploads_dir, current_uploads_backup)
                print(f"✓ Current uploads backed up to {current_uploads_backup}")
            
            shutil.copytree(uploads_backup_path, self.uploads_dir)
            print(f"✓ Uploads restored")
        
        # 3. Handle Alembic migration
        backup_revision = metadata.get('alembic_revision')
        if backup_revision:
            current_revision = self.get_alembic_revision()
            if current_revision != backup_revision:
                print(f"\n⚠ Database schema mismatch detected!")
                print(f"  Current revision: {current_revision}")
                print(f"  Backup revision: {backup_revision}")
                print(f"\nTo sync schema, run:")
                print(f"  docker-compose exec backend bash -c 'cd /app && alembic stamp {backup_revision}'")
                print(f"  docker-compose exec backend bash -c 'cd /app && alembic upgrade head'")
        
        print(f"\n✓ Restore completed successfully!")
        return True
    
    def create_database_dump(self, output_file: Optional[str] = None) -> str:
        """Create a SQL dump of the database"""
        if not output_file:
            timestamp = self.get_timestamp()
            output_file = f"database_dump_{timestamp}.sql"
        
        output_path = self.backup_dir / output_file
        
        if not self.db_path.exists():
            print("Error: Database file not found")
            return ""
        
        # Create SQL dump
        with sqlite3.connect(self.db_path) as conn:
            with open(output_path, 'w') as f:
                for line in conn.iterdump():
                    f.write(f"{line}\n")
        
        print(f"✓ Database dump created: {output_path}")
        return str(output_path)
    
    def restore_from_dump(self, dump_file: str) -> bool:
        """Restore database from SQL dump"""
        dump_path = Path(dump_file)
        if not dump_path.exists():
            dump_path = self.backup_dir / dump_file
        
        if not dump_path.exists():
            print(f"Error: Dump file not found: {dump_file}")
            return False
        
        # Backup current database
        if self.db_path.exists():
            backup_path = self.db_path.with_suffix(f".db.pre_restore_{self.get_timestamp()}")
            shutil.copy2(self.db_path, backup_path)
            print(f"✓ Current database backed up to {backup_path}")
        
        # Restore from dump
        self.data_dir.mkdir(exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            with open(dump_path, 'r') as f:
                conn.executescript(f.read())
        
        print(f"✓ Database restored from dump: {dump_path}")
        return True

def main():
    backup_restore = PATSBackupRestore()
    
    if len(sys.argv) < 2:
        print("PATS Backup & Restore System")
        print("Usage: python backup_restore.py <command> [args]")
        print("\nCommands:")
        print("  backup [name]              - Create a backup")
        print("  list                       - List all backups")
        print("  restore <name> [--force]   - Restore from backup")
        print("  dump [filename]            - Create SQL dump")
        print("  restore-dump <filename>    - Restore from SQL dump")
        print("\nExamples:")
        print("  python backup_restore.py backup")
        print("  python backup_restore.py backup pre_migration")
        print("  python backup_restore.py restore backup_20241201_120000")
        print("  python backup_restore.py dump")
        return 1
    
    command = sys.argv[1]
    
    if command == "backup":
        backup_name = sys.argv[2] if len(sys.argv) > 2 else None
        backup_restore.create_backup(backup_name)
    
    elif command == "list":
        backups = backup_restore.list_backups()
        if not backups:
            print("No backups found")
            return 0
        
        print(f"Available backups ({len(backups)}):")
        print("-" * 80)
        for backup in backups:
            metadata = backup["metadata"]
            print(f"Name: {backup['name']}")
            print(f"Created: {metadata.get('created_at', 'Unknown')}")
            print(f"Revision: {metadata.get('alembic_revision', 'Unknown')}")
            print(f"Database: {'✓' if metadata.get('database_file') else '✗'}")
            print(f"Uploads: {'✓' if metadata.get('uploads_included') else '✗'}")
            print("-" * 80)
    
    elif command == "restore":
        if len(sys.argv) < 3:
            print("Error: Backup name required")
            return 1
        backup_name = sys.argv[2]
        force = "--force" in sys.argv
        backup_restore.restore_backup(backup_name, force)
    
    elif command == "dump":
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        backup_restore.create_database_dump(output_file)
    
    elif command == "restore-dump":
        if len(sys.argv) < 3:
            print("Error: Dump filename required")
            return 1
        dump_file = sys.argv[2]
        backup_restore.restore_from_dump(dump_file)
    
    else:
        print(f"Unknown command: {command}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 