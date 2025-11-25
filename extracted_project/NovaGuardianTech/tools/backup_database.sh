#!/bin/bash
# Database backup script for NovaGuardianTech
# Usage: ./backup_database.sh [output_dir]

set -e

OUTPUT_DIR="${1:-.backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/novaguardian_backup_${TIMESTAMP}.sql"

mkdir -p "$OUTPUT_DIR"

echo "🔄 Starting database backup..."
echo "📁 Output: $BACKUP_FILE"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "📊 Size: $SIZE"
    echo "📁 File: $BACKUP_FILE"
    
    echo ""
    echo "🧹 Cleaning old backups (keeping last 7 days)..."
    find "$OUTPUT_DIR" -name "novaguardian_backup_*.sql" -type f -mtime +7 -delete
    echo "✅ Cleanup complete"
else
    echo "❌ Backup failed!"
    exit 1
fi
