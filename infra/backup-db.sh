#!/usr/bin/env bash
# Database backup. Kept for old instructions — the real logic is in deploy.sh
# (works with your existing Postgres or the bundled one):
#   bash /opt/wheellol/deploy.sh backup
exec bash "$(dirname "$0")/../deploy.sh" backup
