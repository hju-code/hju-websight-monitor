# PostgreSQL 격리 — 후보 A / B

비밀번호·연결문자열은 이 문서에 **없음**. DBA가 서버34에서만 설정.

공통 DDL: [`001_websight_schema.sql`](./001_websight_schema.sql)  
선호: **어느 인스턴스든 schema `websight`** (+ role `websight_app`).

## 후보 A — ai-helper / DB `academic` (문서상 1순위)

| 항목 | 내용 |
|------|------|
| 인스턴스 | 서버34 Docker `hyejeon-academic-db` |
| DB | `academic` |
| 기존 schema | `v3` — **혼재 금지** |
| websight | `\c academic` → `CREATE SCHEMA websight;` → 001 DDL |
| 강한 격리 대안 | 동일 인스턴스에 **별도 DB** `websight` |
| 앱 env | `WEBSIGHT_DATABASE_URL` + `DB_SCHEMA=websight` |

```bash
# DBA 예시 (비밀번호는 서버에서만)
psql "$ACADEMIC_ADMIN_URL" -f db/001_websight_schema.sql
```

## 후보 B — HJU-IR / `hju-ir-db`

| 항목 | 내용 |
|------|------|
| 인스턴스 | 서버34 IR PostgreSQL (문서명 `hju-ir-db`; **실제 DB name은 서버 env 확인**) |
| 기존 | IR public/app — **혼재 금지** |
| websight | 동일 schema `websight` + 001 DDL |
| 주의 | PostgREST 스키마 화이트리스트에 `websight`가 **자동 노출되지 않게** 확인 |
| 앱 env | 서버 deploy env에만 PG URL 설정 |

```bash
# DBA 예시 — 실제 DB명은 서버에서 확인 후
psql "$IR_ADMIN_URL" -f db/001_websight_schema.sql
```

## 선택 가이드 (미승인 권고)

1. **A + schema `websight`** — 접근 경로가 문서상 더 명확.
2. A 인스턴스에서 **별도 DB `websight`** — DBA 가능 시 더 강한 격리.
3. B — IR 백업·PostgREST 경계 합의 가능할 때.

앱 코드는 A/B 모두 동일. 연결 URL만 바꿈.
