-- Transactional application state retained for migration of legacy file-backed data.
CREATE SCHEMA IF NOT EXISTS websight;
CREATE TABLE IF NOT EXISTS websight.app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL
);
