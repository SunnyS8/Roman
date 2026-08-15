#!/usr/bin/env bash
# Deploy Roman (Betsy single-mode) on an Ubuntu VPS with Docker.
# Usage: ./deploy.sh
set -euo pipefail

REPO_URL="https://github.com/SunnyS8/Roman.git"
DEPLOY_DIR="$HOME/roman"
DATA_DIR="$HOME/.betsy"

echo "==> Deploying Roman bot..."

# 1. Clone / update source
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
else
  git -C "$DEPLOY_DIR" pull --ff-only
fi
cd "$DEPLOY_DIR"

# 2. Ensure data dir exists (config.yaml + betsy.db live here)
mkdir -p "$DATA_DIR"

# 3. Build & start (rebuild if image changed)
docker compose -f deploy/docker-compose.yml build --pull
docker compose -f deploy/docker-compose.yml up -d

echo "==> Done. Data dir: $DATA_DIR"
echo "    Put config.yaml and betsy.db into $DATA_DIR BEFORE first start (or restart after)."
echo "    Logs: docker compose -f $DEPLOY_DIR/deploy/docker-compose.yml logs -f betsy"