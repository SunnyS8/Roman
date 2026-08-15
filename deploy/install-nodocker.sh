#!/usr/bin/env bash
# Install Roman (Betsy single-mode) WITHOUT Docker, using Node + systemd.
# Tested on Ubuntu 22.04/24.04 as root.
# Usage: sudo bash install-nodocker.sh
set -euo pipefail

REPO_URL="https://github.com/SunnyS8/Roman.git"
APP_DIR="/opt/roman"
DATA_DIR="/root/.betsy"

echo "==> Installing Roman bot (systemd, no Docker)..."

# 1. Prerequisites
apt-get update
apt-get install -y ca-certificates curl git build-essential python3 python3-pip

# Node 22 LTS
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# edge-tts CLI for voice replies
pip3 install --break-system-packages edge-tts || pip3 install edge-tts

# 2. Source code
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi
cd "$APP_DIR"

# 3. Build
npm ci
npm run build

# 4. Data dir (config.yaml + betsy.db)
mkdir -p "$DATA_DIR"

# 5. systemd unit
cp deploy/betsy.service /etc/systemd/system/betsy.service
systemctl daemon-reload
systemctl enable betsy
systemctl restart betsy

echo "==> Done."
echo "    Data dir: $DATA_DIR  (put config.yaml and betsy.db there)"
echo "    Logs: journalctl -u betsy -f"
echo "    Status: systemctl status betsy"