#!/usr/bin/env bash
# Local / cloud smoke: health, routes, settings, Kin E2E (no auto-post).
set -euo pipefail
BASE="${1:-http://127.0.0.1:3040}"

echo "== health =="
curl -sf "$BASE/api/health" | head -c 400; echo

echo "== routes =="
for p in /stats /review /admin /admin/settings /login; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")
  echo "  $p -> $code"
done

echo "== settings save/load =="
curl -sf -X POST "$BASE/api/settings" -H 'Content-Type: application/json' \
  -d '{"settings_section":"platforms","enabled_platforms":["naver_web","daum_web","youtube"]}' >/dev/null
curl -sf "$BASE/api/settings" | grep -q naver_web

echo "== kin detect → draft → approve =="
curl -sf -X POST "$BASE/api/kin/detect" >/dev/null
QID=$(curl -sf "$BASE/api/kin/detect" | python3 -c 'import sys,json; print(json.load(sys.stdin)["questions"][0]["id"])')
DRAFT=$(curl -sf -X POST "$BASE/api/kin/drafts" -H 'Content-Type: application/json' \
  -d "{\"action\":\"generate\",\"questionId\":\"$QID\"}")
echo "$DRAFT" | grep -q '"autoPostEnabled":false'
DID=$(echo "$DRAFT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["draft"]["id"])')
curl -sf -X POST "$BASE/api/kin/drafts" -H 'Content-Type: application/json' \
  -d "{\"action\":\"approve\",\"draftId\":\"$DID\"}" | grep -q approved

echo "== auth roles =="
curl -sf -X POST "$BASE/api/auth" -H 'Content-Type: application/json' \
  -d '{"email":"advisor@example.com","mode":"dev_session"}' | grep -q assignee
curl -sf -X POST "$BASE/api/auth" -H 'Content-Type: application/json' \
  -d '{"email":"websight-admin@hj.ac.kr","mode":"dev_session"}' | grep -q admin

echo "SMOKE OK — school 혜전대학교 · auto-post disabled"
