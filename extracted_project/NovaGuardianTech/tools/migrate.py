#!/usr/bin/env python3
"""
Database migration script for production deployments.
Automatically runs Alembic migrations on startup.
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

from alembic import command
from alembic.config import Config
from core.database import engine
from sqlalchemy import text


def check_database_connection():
    """Check if database is accessible"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def run_migrations():
    """Run all pending migrations"""
    try:
        alembic_cfg = Config(str(Path(__file__).parent.parent / "apps" / "api" / "alembic.ini"))
        alembic_cfg.set_main_option("script_location", 
                                     str(Path(__file__).parent.parent / "apps" / "api" / "migrations"))
        
        print("🔄 Running database migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


def main():
    """Main migration flow"""
    print("=" * 60)
    print("NovaGuardianTech - Database Migration")
    print("=" * 60)
    
    if not check_database_connection():
        sys.exit(1)
    
    if not run_migrations():
        sys.exit(1)
    
    print("\n✅ All migrations completed successfully!")
    sys.exit(0)


if __name__ == "__main__":
    main()
