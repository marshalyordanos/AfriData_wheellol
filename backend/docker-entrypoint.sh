#!/bin/sh
set -e

# Apply pending Prisma migrations before the services start.
# Set RUN_MIGRATIONS=false to skip (e.g. while restoring a database dump).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
fi

exec "$@"
