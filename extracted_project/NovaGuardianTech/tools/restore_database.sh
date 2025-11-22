#!/bin/bash
# Database restore script for NovaGuardianTech
# Usage: ./restore_database.sh <backup_file>

set -e

if [ -z "$1" ]; then
    echo "❌ ERROR: Please provide backup file path"
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE all data in the database!"
echo "📁 Backup file: $BACKUP_FILE"
echo "🗄️  Database: $DATABASE_URL"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Restoring database..."

psql "$DATABASE_URL" < "$BACKUP_FILE"

echo "✅ Database restored successfully!"
echo ""
echo "⚠️  Remember to:"
echo "  1. Restart the API: systemctl restart novaguardian-api"
echo "  2. Sync DNS rules: curl -X POST http://localhost:8080/dns/sync"
