#!/usr/bin/env bash
# Daily backup of Roman's data (SQLite + config).
# Safe for a live DB (uses sqlite3 .backup, not cp).
set -euo pipefail

DATA_DIR="/root/.betsy"
BACKUP_DIR="/root/.betsy/backups"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d)
DB_BACKUP="$BACKUP_DIR/betsy-$DATE.db"
CFG_BACKUP="$BACKUP_DIR/config-$DATE.yaml"

# Online-safe backup of the live SQLite database
sqlite3 "$DATA_DIR/betsy.db" ".backup '$DB_BACKUP'"
cp "$DATA_DIR/config.yaml" "$CFG_BACKUP"

# Verify the backup is valid
if sqlite3 "$DB_BACKUP" "PRAGMA integrity_check;" | grep -q ok; then
  echo "$(date '+%F %T') backup OK: $DB_BACKUP ($(du -h "$DB_BACKUP" | cut -f1))"
else
  echo "$(date '+%F %T') ERROR: backup integrity check failed" >&2
  exit 1
fi

# Rotate old backups (keep only the last N days)
find "$BACKUP_DIR" -name "betsy-*.db" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "config-*.yaml" -mtime +"$RETENTION_DAYS" -delete