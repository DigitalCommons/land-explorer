#!/usr/bin/env bash

# Dump a database and copy it to the Hetzner backup storage box
# Runs inside the pbs container
# Schedule on Coolify (daily FE user data, monthly PBS):
#
# 30 2 * * *
# bash scripts/backup-databases.sh land_explorer
#
# 30 2 11 * *
# bash scripts/backup-databases.sh property_boundaries
#
# Retention, applied to $BACKUP_DESTINATION_PATH/<db>/<db>-YYYY-MM-DD.sql.gz:
#   land_explorer:        daily kept for 31 days, 1st of month kept 2 years
#   property_boundaries:  kept 6 months
# The raw INSPIRE download backups (backup-inspire-downloads.sh) are kept forever

set -euo pipefail

DB=${1:?usage: backup-databases.sh <land_explorer|property_boundaries>}
HOSTNAME=$(hostname)

notify() {
  if [ -n "${MATRIX_WEBHOOK_URL:-}" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"msgtype\":\"m.text\", \"body\":\"[$HOSTNAME] [$DB] $1\"}" \
      "$MATRIX_WEBHOOK_URL" >/dev/null || true
  fi
}

trap 'code=$?; if [ $code != 0 ]; then notify "DB backup FAILED"; fi' EXIT

case "$DB" in
  land_explorer)       DAILY_KEEP_DAYS=31; MONTHLY_KEEP_DAYS=730 ;;
  property_boundaries) DAILY_KEEP_DAYS=183; MONTHLY_KEEP_DAYS=183 ;;
  *) echo "Unknown database: $DB"; exit 1 ;;
esac

: "${BACKUP_DESTINATION_PATH:?BACKUP_DESTINATION_PATH not set}"
SERVER="${BACKUP_DESTINATION_PATH%%:*}"
BASE="${BACKUP_DESTINATION_PATH#*:}"
SSH="ssh -p${REMOTE_BACKUP_SSH_PORT:-22} -o StrictHostKeyChecking=no"
TODAY=$(date +%F)
FILE="$DB-$TODAY.sql.gz"
TMPDIR="downloads/backups"

mkdir -p "$TMPDIR"
echo "Dumping $DB..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction --quick --no-tablespaces "$DB" \
  | gzip > "$TMPDIR/$FILE"

echo "Uploading $FILE ($(du -h "$TMPDIR/$FILE" | cut -f1))..."
$SSH "$SERVER" "mkdir -p $BASE/$DB"
rsync -e "$SSH" "$TMPDIR/$FILE" "$SERVER:$BASE/$DB/"
rm -f "$TMPDIR/$FILE"

echo "Pruning old backups..."
NOW=$(date +%s)
DELETED=0
for f in $($SSH "$SERVER" "ls $BASE/$DB" 2>/dev/null); do
  d=$(echo "$f" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)
  [ -n "$d" ] || continue
  age_days=$(( (NOW - $(date -d "$d" +%s)) / 86400 ))
  keep_days=$DAILY_KEEP_DAYS
  case "$d" in *-01) keep_days=$MONTHLY_KEEP_DAYS ;; esac
  if [ "$age_days" -gt "$keep_days" ]; then
    echo "  deleting $f (${age_days}d old)"
    $SSH "$SERVER" "rm -f $BASE/$DB/$f"
    DELETED=$((DELETED + 1))
  fi
done

echo "Done: $FILE uploaded, $DELETED pruned"
notify "DB backup successful ($FILE, $DELETED old pruned)"
