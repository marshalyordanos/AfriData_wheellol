#!/usr/bin/env bash
# Dump the production database to ./backups (run on the server from the
# deploy folder). Add to cron for daily backups, e.g.:
#   0 3 * * * cd /opt/wheellol && bash infra/backup-db.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

mkdir -p backups
file="backups/${POSTGRES_DB:-wheellol}-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "${POSTGRES_DB:-wheellol}" | gzip > "$file"
echo "Saved $file"

# keep the last 14 dumps
ls -1t backups/*.sql.gz | tail -n +15 | xargs -r rm --
