#!/usr/bin/env bash
# Healthcheck for Roman: ensure WireGuard tunnel is up and OpenRouter reachable.
# If the tunnel is down or the API is unreachable, restart it. Logs everything.
set -uo pipefail

LOG="/var/log/roman-health.log"
WG_SVC="wg-quick@wg0"
OR_KEY_FILE="/root/.betsy/config.yaml"
OR_URL="https://openrouter.ai/api/v1/auth/key"
TIMEOUT=12

log() { echo "$(date '+%F %T') $1" >> "$LOG"; }

# 1. Tunnel active?
if ! systemctl is-active --quiet "$WG_SVC"; then
  log "TUNNEL DOWN - restarting $WG_SVC"
  systemctl restart "$WG_SVC"
  sleep 3
fi

# 2. Is OpenRouter reachable through the tunnel?
# Extract api_key from config without printing it.
OR_KEY=$(grep -A3 '^llm:' "$OR_KEY_FILE" | grep 'api_key:' | head -1 | sed 's/.*api_key:[[:space:]]*//')

if [ -z "$OR_KEY" ]; then
  log "ERROR: cannot find OpenRouter api_key in config"
  exit 1
fi

HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" \
  -H "Authorization: Bearer $OR_KEY" "$OR_URL" 2>/dev/null || echo "000")

if [ "$HTTP" = "000" ] || [ "$HTTP" = "403" ] || [ "$HTTP" -ge 500 ]; then
  log "API UNREACHABLE (HTTP $HTTP) - restarting tunnel + bot"
  systemctl restart "$WG_SVC"
  sleep 4
  systemctl restart betsy
  # Log success/failure after restart
  HTTP2=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" \
    -H "Authorization: Bearer $OR_KEY" "$OR_URL" 2>/dev/null || echo "000")
  log "After restart: HTTP $HTTP2"
else
  # Healthy - quiet (only log on state change to avoid log spam every 5 min)
  true
fi