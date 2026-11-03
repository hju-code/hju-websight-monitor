# 혜전대학교 WebSight Monitor (`hju-websight-monitor`)

**혜전대학교** (`hj.ac.kr`) 웹 검색 순위 통계 + 지식iN 반자동 검토 내부 앱.  
이명: **해전대 = 혜전대**만 허용. **답글 자동 게시 없음.**

| 영역 | 경로 | 접근 |
|------|------|------|
| 공개 통계 | `/` → `/stats` | 누구나 — 실집계(파일/PG) |
| 지식인 검토 | `/review` | 담당자 이메일 로그인 |
| 관리자 | `/admin` | 키워드·설정·담당자·지식·Kin |

- SERP: **네이버·다음 웹** (체크된 플랫폼만). 원문 미저장 · TTL≤21일  
- **Google 수집 구현 보류** — 키 조사만  
- 저장: PG(`WEBSIGHT_DATABASE_URL`) 없으면 **`data/websight-store.json`**  
- 인증: 매직링크 + 개발용 이메일 세션 (`WEBSIGHT_DEV_AUTH`)

원격 git push/PR·서버34 SSH는 별도 지시 전까지 금지.

---

## 빠른 시작 (클라우드 / PC)

```bash
unzip hju-websight-monitor.zip && cd hju-websight-monitor
cp .env.example .env
npm install
npm run build
npm run dev          # http://127.0.0.1:3040/stats  (PORT 기본 3040)
# 또는 npm start  (build 후)
bash scripts/smoke.sh http://127.0.0.1:3040
```

시드 로그인: 관리자 `websight-admin@hj.ac.kr` · 담당자 `advisor@example.com`  
`/login` → **개발: 담당자/관리자 세션** 또는 매직링크.

---

## 서버34 배포 (내일 PC)

1. 이 zip을 PC로 가져와 풀기.  
2. `.env`에 `NAVER_*`, `KAKAO_REST_API_KEY`, (가능하면) `WEBSIGHT_DATABASE_URL`, `WEBSIGHT_ADMIN_TOKEN` 채우기.  
3. DBA: `db/001`→`002`→`003` schema `websight`.  
4. `agent worker start` 후 서버34 **별도 폴더** 복사 (예: `/opt/hju/hju-websight-monitor`).  
5. 서버에서 `bash deploy/install-on-server34.sh` → PM2 · cron.  
6. 스모크: `curl :3040/api/health` · `/stats` · `/review` · `/admin`.

상세: Project `docs/websight-server34-deploy.md` · zip 안 `deploy/checklist.md`.

---

## 구조

```
src/app/stats|review|admin|login   세 역할 UI
src/app/api/*                      실동작 API (파일 스토어)
src/db/file-store.ts · store.ts    PG 없을 때 JSON 저장
src/collectors                     Naver/Daum 실구현, Kin 감지, Google 보류
src/auth/session.ts                매직링크·개발 세션
db/001–003 · deploy/ · scripts/smoke.sh
```

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (PORT=3040) |
| `npm run build` / `start` | 프로덕션 |
| `npm run dry-run` | 수집 드라이런 |
| `npm run collect` | 수집 (체크 플랫폼만) |
| `bash scripts/smoke.sh` | 라우트·Kin E2E 스모크 |

---

## Env 요약

`NAVER_*`, `KAKAO_REST_API_KEY`, `WEBSIGHT_DATABASE_URL`(선택), `ENABLED_PLATFORMS`,  
`WEBSIGHT_DEV_AUTH=true`, `TOS_MODE=derived_meta`, `SNAPSHOT_TTL_DAYS=21`, `GOOGLE_ENABLED=false`.

*시크릿 없음.*
