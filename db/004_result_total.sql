-- WM-26: store provider search-result totals (Naver webkr `total`, etc.)
ALTER TABLE websight.rank_snapshots
  ADD COLUMN IF NOT EXISTS result_total BIGINT;

COMMENT ON COLUMN websight.rank_snapshots.result_total IS
  'Provider-reported search hit total (Naver webkr total / Daum meta.total_count)';
