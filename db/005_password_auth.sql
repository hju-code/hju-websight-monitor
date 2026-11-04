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
