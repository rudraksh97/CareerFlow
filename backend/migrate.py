#!/usr/bin/env python3
"""
Database migration utility script
Provides convenient commands for Alembic operations
"""

import sys
import os
import subprocess

def run_alembic_command(cmd):
    """Run an Alembic command in the correct directory"""
    os.chdir('/app')
    result = subprocess.run(['alembic'] + cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate.py <command>")
        print("Commands:")
        print("  current          - Show current migration revision")
        print("  history          - Show migration history")
        print("  upgrade          - Apply all pending migrations")
        print("  downgrade <rev>  - Downgrade to specific revision")
        print("  revision <msg>   - Create new migration with message")
        print("  autogenerate <msg> - Auto-generate migration with message")
        return 1

    command = sys.argv[1]
    
    if command == "current":
        return run_alembic_command(["current"])
    elif command == "history":
        return run_alembic_command(["history"])
    elif command == "upgrade":
        return run_alembic_command(["upgrade", "head"])
    elif command == "downgrade":
        if len(sys.argv) < 3:
            print("Error: downgrade requires revision argument")
            return 1
        return run_alembic_command(["downgrade", sys.argv[2]])
    elif command == "revision":
        if len(sys.argv) < 3:
            print("Error: revision requires message argument")
            return 1
        return run_alembic_command(["revision", "-m", sys.argv[2]])
    elif command == "autogenerate":
        if len(sys.argv) < 3:
            print("Error: autogenerate requires message argument")
            return 1
        return run_alembic_command(["revision", "--autogenerate", "-m", sys.argv[2]])
    else:
        print(f"Unknown command: {command}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 