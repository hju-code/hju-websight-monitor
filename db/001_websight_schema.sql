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
