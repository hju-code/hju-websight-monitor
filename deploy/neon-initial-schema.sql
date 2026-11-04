BEGIN;

-- =============================================================================
-- HJU WebSight Monitor — schema `websight` DDL (P1)
-- Apply on candidate A (academic / ai-helper) OR candidate B (hju-ir-db).
-- Do NOT mix tables into ai-helper `v3` or IR app schemas.
-- Passwords / connection strings: DBA only — never commit secrets.
-- See db/README-db.md for A/B placement notes.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS websight;

-- Dedicated app role (password set by DBA — placeholder commented out)
-- CREATE ROLE websight_app LOGIN PASSWORD '...';
-- GRANT USAGE ON SCHEMA websight TO websight_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA websight
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO websight_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA websight
--   GRANT USAGE, SELECT ON SEQUENCES TO websight_app;

SET search_path TO websight, public;

CREATE TABLE IF NOT EXISTS websight.keywords (
  id            BIGSERIAL PRIMARY KEY,
  phrase        TEXT NOT NULL UNIQUE,
  is_brand      BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  match_mode    TEXT NOT NULL DEFAULT 'domain_or_name'
                  CHECK (match_mode IN ('domain_or_name', 'name_only', 'domain_only')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS websight.channels (
  id            BIGSERIAL PRIMARY KEY,
  engine        TEXT NOT NULL CHECK (engine IN ('naver', 'daum', 'google')),
  tab           TEXT NOT NULL CHECK (tab IN ('web', 'news', 'blog', 'cafe', 'kin')),
  device        TEXT NOT NULL DEFAULT 'desktop',
  is_enabled    BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (engine, tab, device)
);

CREATE TABLE IF NOT EXISTS websight.runs (
  id            BIGSERIAL PRIMARY KEY,
  triggered_by  TEXT NOT NULL DEFAULT 'schedule'
                  CHECK (triggered_by IN ('schedule', 'manual', 'test')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'ok', 'partial', 'failed')),
  notes         TEXT
);

-- Derived ranking snapshot only — NO title / snippet / raw JSON columns (ToS A1)
CREATE TABLE IF NOT EXISTS websight.rank_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  run_id          BIGINT NOT NULL REFERENCES websight.runs(id),
  keyword_id      BIGINT NOT NULL REFERENCES websight.keywords(id),
  channel_id      BIGINT NOT NULL REFERENCES websight.channels(id),
  collected_at    TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ,  -- collected_at + TTL (default 21 days)
  scan_depth      INT NOT NULL DEFAULT 100,
  scanned_count   INT NOT NULL DEFAULT 0,
  school_rank     INT,          -- NULL = not_found
  school_status   TEXT NOT NULL CHECK (school_status IN ('ok', 'not_found', 'error', 'skipped')),
  matched_url     TEXT,         -- normalized URL (no title)
  matched_domain  TEXT,
  request_count   INT NOT NULL DEFAULT 0,
  provider_status TEXT,
  error_code      TEXT,
  UNIQUE (run_id, keyword_id, channel_id)
);

CREATE INDEX IF NOT EXISTS rank_snapshots_expires_idx
  ON websight.rank_snapshots (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS rank_snapshots_kw_ch_time_idx
  ON websight.rank_snapshots (keyword_id, channel_id, collected_at DESC);

-- Optional long-term daily aggregates (numbers only). Keep AGGREGATE_KEEP=false until clearance.
CREATE TABLE IF NOT EXISTS websight.rank_daily (
  day           DATE NOT NULL,
  keyword_id    BIGINT NOT NULL REFERENCES websight.keywords(id),
  channel_id    BIGINT NOT NULL REFERENCES websight.channels(id),
  school_rank   INT,
  school_status TEXT NOT NULL,
  PRIMARY KEY (day, keyword_id, channel_id)
);

-- P1 seeds
INSERT INTO websight.keywords (phrase, is_brand) VALUES
  ('혜전대학교', true),
  ('혜전대', true)
ON CONFLICT (phrase) DO NOTHING;

INSERT INTO websight.channels (engine, tab, device, is_enabled) VALUES
  ('naver', 'web', 'desktop', true),
  ('daum',  'web', 'desktop', true),
  ('google','web', 'desktop', false)  -- deferred (assumption A2)
ON CONFLICT (engine, tab, device) DO NOTHING;

-- Optional grants after role exists:
-- GRANT USAGE ON SCHEMA websight TO websight_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA websight TO websight_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA websight TO websight_app;


-- Kin assisted-reply + admin knowledge (P1 additive).
-- Apply after 001_websight_schema.sql on the same schema `websight`.
-- NO auto-post columns / queues — product forbids automatic Naver posting.

SET search_path TO websight, public;

CREATE TABLE IF NOT EXISTS websight.knowledge_entries (
  id              BIGSERIAL PRIMARY KEY,
  category        TEXT NOT NULL CHECK (category IN (
                    'department', 'admission', 'tuition', 'campus', 'other')),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  revision_label  TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      TEXT
);

CREATE TABLE IF NOT EXISTS websight.kin_questions (
  id              BIGSERIAL PRIMARY KEY,
  naver_url       TEXT NOT NULL UNIQUE,
  naver_doc_id    TEXT,
  title           TEXT NOT NULL,
  question_text   TEXT NOT NULL,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'drafted', 'approved', 'dismissed', 'manual_posted')),
  matched_aliases TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS websight.kin_drafts (
  id                    BIGSERIAL PRIMARY KEY,
  question_id           BIGINT NOT NULL REFERENCES websight.kin_questions(id),
  draft_body            TEXT NOT NULL,
  source_knowledge_ids  BIGINT[] NOT NULL DEFAULT '{}',
  status                TEXT NOT NULL DEFAULT 'pending_review'
                          CHECK (status IN (
                            'pending_review', 'approved', 'rejected', 'copied_for_manual_post')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at           TIMESTAMPTZ,
  reviewer_note         TEXT
);

-- Explicit product note: there is no kin_auto_posts / publish_queue table.
COMMENT ON TABLE websight.kin_drafts IS
  'Admin review drafts only. Auto-post to Naver is forbidden.';


-- Admin keywords/settings + per-keyword assignees (P1 additive).
-- Apply after 001 + 002. No Naver auto-post tables.

SET search_path TO websight, public;

CREATE TABLE IF NOT EXISTS websight.app_settings (
  key           TEXT PRIMARY KEY,
  value         JSONB NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    TEXT
);

-- Seed settings keys (values filled by admin UI)
INSERT INTO websight.app_settings (key, value) VALUES
  ('auth_strategy', '"magic_link"'::jsonb),
  ('tos_mode', '"derived_meta"'::jsonb),
  ('snapshot_ttl_days', '21'::jsonb),
  ('google_enabled', 'false'::jsonb),
  ('kin_auto_post', 'false'::jsonb),
  -- Checked platforms for periodic collect (admin checkbox UI)
  -- Active defaults per platform-expansion: naver/daum web + youtube
  ('enabled_platforms', '["naver_web","daum_web","youtube"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS websight.assignees (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS websight.keyword_assignments (
  id            BIGSERIAL PRIMARY KEY,
  keyword_id    BIGINT NOT NULL REFERENCES websight.keywords(id),
  site_key      TEXT NOT NULL DEFAULT 'naver-kin',
  assignee_id   BIGINT NOT NULL REFERENCES websight.assignees(id),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (keyword_id, site_key, assignee_id)
);

CREATE TABLE IF NOT EXISTS websight.auth_sessions (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'assignee')),
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE websight.auth_sessions IS
  'Magic-link sessions (strategy B). If strategy A (campus IdP) is chosen, this may be unused.';

COMMENT ON COLUMN websight.app_settings.key IS
  'kin_auto_post must remain false — product forbids automatic Naver replies.';


-- WM-26: store provider search-result totals (Naver webkr `total`, etc.)
ALTER TABLE websight.rank_snapshots
  ADD COLUMN IF NOT EXISTS result_total BIGINT;

COMMENT ON COLUMN websight.rank_snapshots.result_total IS
  'Provider-reported search hit total (Naver webkr total / Daum meta.total_count)';


-- Password accounts and opaque server-side sessions. Existing magic-link tables are untouched.
CREATE SCHEMA IF NOT EXISTS websight;
CREATE TABLE IF NOT EXISTS websight.accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'assignee')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_lower_unique ON websight.accounts (lower(email));
CREATE TABLE IF NOT EXISTS websight.password_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES websight.accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_sessions_account_idx ON websight.password_sessions(account_id);
CREATE INDEX IF NOT EXISTS password_sessions_expiry_idx ON websight.password_sessions(expires_at);


-- Transactional application state retained for migration of legacy file-backed data.
CREATE SCHEMA IF NOT EXISTS websight;
CREATE TABLE IF NOT EXISTS websight.app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL
);


COMMIT;
