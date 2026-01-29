#!/usr/bin/env bash
set -euo pipefail

# ---- helpers ----
die() { echo "ERROR: $*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Command not found: $1"
}

prompt() {
  local var_name="$1"
  local label="$2"
  local default="${3:-}"
  local value=""

  if [[ -n "$default" ]]; then
    read -r -p "${label} [${default}]: " value
    value="${value:-$default}"
  else
    read -r -p "${label}: " value
  fi

  [[ -n "$value" ]] || die "${label} is required"
  printf -v "$var_name" '%s' "$value"
}

# ---- preflight ----
need_cmd ssh
need_cmd scp
need_cmd rsync || true
need_cmd npm

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
FRONT_DIR="$ROOT_DIR/apps/dashboard"
BACK_DIR="$ROOT_DIR/apps/api"
NGINX_CONF="$ROOT_DIR/deployment/dashboard/nginx/waste-dashboard.conf"

[[ -d "$FRONT_DIR" ]] || die "frontend dir not found: $FRONT_DIR"
[[ -d "$BACK_DIR"  ]] || die "backend dir not found: $BACK_DIR"

echo "=== Deploy to Raspberry Pi (SORACOM Napter) ==="

prompt SSH_PORT "SSH port (-p)" ""
prompt SSH_HOST "SSH host (e.g. 54-xxx.napter.soracom.io)" ""
prompt SSH_USER "SSH user (-l)" ""

REMOTE="${SSH_USER}@${SSH_HOST}"

# Remote paths (Pi side)
REMOTE_BASE="/opt/waste-dashboard"
REMOTE_FRONT="${REMOTE_BASE}/frontend"
REMOTE_BACK="${REMOTE_BASE}/backend"

echo ""
echo "Target: ${REMOTE} (port ${SSH_PORT})"
echo "Remote frontend: ${REMOTE_FRONT}/dist"
echo "Remote backend:  ${REMOTE_BACK}"

echo ""
read -r -p "Proceed? (y/N): " yn
[[ "${yn}" == "y" || "${yn}" == "Y" ]] || exit 0

# ---- build frontend ----
echo ""
echo "=== Build frontend ==="
cd "$FRONT_DIR"
npm ci
npm run build
[[ -f "$FRONT_DIR/dist/index.html" ]] || die "frontend build failed (dist/index.html not found)"

# ---- build backend ----
echo ""
echo "=== Build backend ==="
cd "$BACK_DIR"
npm ci
npm run build
[[ -f "$BACK_DIR/dist/server.js" ]] || echo "WARN: dist/server.js not found (check your backend build output name)"

# ---- ensure remote directories ----
echo ""
echo "=== Ensure remote directories ==="
ssh -p "$SSH_PORT" "$REMOTE" "sudo mkdir -p '$REMOTE_FRONT' '$REMOTE_BACK' && sudo chown -R '$SSH_USER':'$SSH_USER' '$REMOTE_BASE'"

# ---- upload frontend dist ----
echo ""
echo "=== Upload frontend dist ==="
# rsync is faster; fall back to scp if needed
if command -v rsync >/dev/null 2>&1; then
  rsync -avz --delete -e "ssh -p $SSH_PORT" "$FRONT_DIR/dist/" "$REMOTE:$REMOTE_FRONT/dist/"
else
  scp -P "$SSH_PORT" -r "$FRONT_DIR/dist" "$REMOTE:$REMOTE_FRONT/"
fi

# ---- upload backend dist + package files + data ----
echo ""
echo "=== Upload backend runtime ==="
# dist
if command -v rsync >/dev/null 2>&1; then
  rsync -avz --delete -e "ssh -p $SSH_PORT" "$BACK_DIR/dist/" "$REMOTE:$REMOTE_BACK/dist/"
else
  scp -P "$SSH_PORT" -r "$BACK_DIR/dist" "$REMOTE:$REMOTE_BACK/"
fi

# ---- upload backend env (.env.pi -> .env) ----
ENV_PI_FILE="$BACK_DIR/.env.pi"

if [[ -f "$ENV_PI_FILE" ]]; then
  echo ""
  echo "=== Upload backend env (.env.pi -> .env) ==="
  scp -P "$SSH_PORT" "$ENV_PI_FILE" "$REMOTE:$REMOTE_BACK/.env"
else
  echo "WARN: .env.pi not found at $ENV_PI_FILE (skipping env upload)"
fi

# package.json / lock
scp -P "$SSH_PORT" \
  "$BACK_DIR/package.json" \
  "$BACK_DIR/package-lock.json" \
  "$REMOTE:$REMOTE_BACK/"

# data (csv/json etc)
if [[ -d "$BACK_DIR/data" ]]; then
  if command -v rsync >/dev/null 2>&1; then
    rsync -avz --delete -e "ssh -p $SSH_PORT" "$BACK_DIR/data/" "$REMOTE:$REMOTE_BACK/data/"
  else
    scp -P "$SSH_PORT" -r "$BACK_DIR/data" "$REMOTE:$REMOTE_BACK/"
  fi
else
  echo "INFO: backend/data not found, skipping."
fi

# ---- upload nginx config ----
if [[ -f "$NGINX_CONF" ]]; then
  echo ""
  echo "=== Upload nginx config ==="
  scp -P "$SSH_PORT" "$NGINX_CONF" "$REMOTE:/tmp/waste-dashboard.conf"
else
  echo "WARN: nginx config not found at $NGINX_CONF (skipping)"
fi

# ---- install prod deps & restart services (optional) ----
echo ""
read -r -p "On Pi: npm ci --omit=dev and restart backend+nginx? (y/N): " restart
if [[ "${restart}" == "y" || "${restart}" == "Y" ]]; then
  ssh -p "$SSH_PORT" "$REMOTE" "
    set -e;
    cd '$REMOTE_BACK';
    npm ci --omit=dev;
    sudo systemctl restart waste-backend || true;
    sudo nginx -t && sudo systemctl restart nginx || true;
    echo 'Restart done';
  "
else
  echo "Skip restart."
fi

echo ""
echo "=== Done ==="
echo "Tip: You can tunnel and open http://localhost:8080 if needed."
