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
