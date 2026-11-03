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
