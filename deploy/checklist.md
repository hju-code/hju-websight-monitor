# 서버34 배포 체크리스트 (ai-helper / HJU-IR과 별도)
# 학교명: 혜전대학교 (이명 해전대=혜전대)
# 상태: zip 기준 **배포 준비 완료** — 내일 PC에서 unzip 후 바로 적용 가능 (클라우드에서 SSH 안 함)

## PC에서

- [ ] zip 해제 → `hju-websight-monitor/`
- [ ] `cp .env.example .env` → `NAVER_*`, `KAKAO_REST_API_KEY`, `WEBSIGHT_ADMIN_TOKEN` 채움
- [ ] (선택) `WEBSIGHT_DATABASE_URL` — 없으면 파일 스토어로 기동 가능
- [ ] `npm install && npm run build && bash scripts/smoke.sh http://127.0.0.1:3040`
- [ ] `agent worker start` 후 Project가 서버34 **별도 폴더** 생성·코드 복사

## 서버34에서

- [ ] 경로 예: `/opt/hju/hju-websight-monitor` (ai-helper / HJU-IR과 분리)
- [ ] `.env` 서버에만 보관 (Git 금지). `GOOGLE_ENABLED=false`
- [ ] DBA: PG A vs B → DDL `001`+`002`+`003` (schema `websight`)
- [ ] `bash deploy/install-on-server34.sh` · PM2 (`deploy/pm2.ecosystem.config.cjs`) · cron
- [ ] `curl -s localhost:3040/api/health` · 공개 `/stats` · 검토 `/review` · 관리 `/admin`
- [ ] 플랫폼: `/admin/settings` 체크 → 수집 반영 (기본 naver/daum/youtube)
- [ ] `kin_auto_post` 꺼짐 · 원문 미저장·TTL≤21
- [ ] 프로덕션에서는 `WEBSIGHT_DEV_AUTH=false` + 매직링크/SMTP 또는 캠퍼스 IdP
- [ ] Custom Search JSON 기존 키 유무만 확인 (수집 구현 보류)
- [ ] 리버스 프록시 URL 확정
