#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu server (e.g. a DigitalOcean droplet).
# Run as root:  bash server-setup.sh
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/wheellol}"

# 1. Docker Engine + compose plugin
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

# 2. Firewall: SSH + HTTP/HTTPS only (the database is NOT exposed)
if command -v ufw >/dev/null; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 443/udp
  ufw --force enable
fi

# 3. Swap (helps small droplets)
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile
  mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 4. App folder
mkdir -p "$DEPLOY_PATH"
echo
echo "Done. Next:"
echo "  1. Put .env in $DEPLOY_PATH  (template: .env.example in the repo)"
echo "  2. Make sure nothing else is using ports 80/443 (old nginx, old node apps)"
echo "  3. Add the SSH_HOST / SSH_USER / SSH_KEY secrets in GitHub and push to main"
