#!/usr/bin/env bash
# Install / refresh hju-websight-monitor on campus server34.
# Run ON server34 after code is copied. Does NOT SSH from cloud (PC off = no SSH).
# Keeps a SEPARATE folder from ai-helper and HJU-IR.
set -euo pipefail

APP_NAME="hju-websight-monitor"
# Preferred layout — change if campus convention differs
DEFAULT_ROOT="/opt/hju/${APP_NAME}"
ROOT="${WEBSIGHT_ROOT:-$DEFAULT_ROOT}"

echo "==> WebSight install root: $ROOT"
echo "    (separate from ai-helper / HJU-IR trees)"

if [[ ! -f "$ROOT/package.json" ]]; then
  echo "ERROR: $ROOT/package.json missing."
  echo "Copy unzipped sources here first, e.g.:"
  echo "  sudo mkdir -p /opt/hju && sudo chown \$USER:\$USER /opt/hju"
  echo "  rsync -a ./hju-websight-monitor/ $ROOT/"
  exit 1
fi

cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "WARN: .env missing — copy from .env.example and fill campus secrets"
  cp -n .env.example .env || true
fi

echo "==> npm ci"
npm ci

echo "==> next build"
npm run build

echo "==> Done build. Next steps:"
echo "  1) DBA: apply db/001_websight_schema.sql on candidate A or B"
echo "  2) Fill .env (NAVER_*, KAKAO_*, WEBSIGHT_DATABASE_URL)"
echo "  3) pm2 start deploy/pm2.ecosystem.config.cjs"
echo "  4) Install deploy/cron.example lines"
echo "  5) Smoke: curl -s localhost:3040/api/health"
echo "Assumed URL (internal): http://<server34-host>:3040/  or campus reverse-proxy path"
echo "Do NOT share AI-helper / IR ports or process names."
