import { loadAppEnv } from "../config/env";
import { computeExpiresAt, loadTosPolicy } from "../config/tos";
import { getPool } from "./pool";

export interface DerivedRankRow {
  keywordId: number;
  channelId: number;
  collectedAt: Date;
  scanDepth: number;
  scannedCount: number;
  schoolRank: number | null;
  schoolStatus: "ok" | "not_found" | "error" | "skipped";
  matchedUrl: string | null;
  matchedDomain: string | null;
  /** Provider search-result total (Naver webkr `total`) */
  resultTotal?: number | null;
  requestCount: number;
  providerStatus: string | null;
  errorCode: string | null;
}

/** Create a run row. */
export async function createRun(triggeredBy: "schedule" | "manual" | "test") {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO runs (triggered_by, status) VALUES ($1, 'running') RETURNING id`,
    [triggeredBy],
  );
  return Number(rows[0].id);
}

export async function finishRun(
  runId: number,
  status: "ok" | "partial" | "failed",
  notes?: string,
) {
  const pool = getPool();
  await pool.query(
    `UPDATE runs SET finished_at = now(), status = $2, notes = $3 WHERE id = $1`,
    [runId, status, notes ?? null],
  );
}

/**
 * Persist derived ranking meta only — no title/snippet/raw columns exist.
 */
export async function insertRankSnapshot(runId: number, row: DerivedRankRow) {
  const tos = loadTosPolicy();
  const expiresAt = computeExpiresAt(row.collectedAt, tos.snapshotTtlDays);
  const pool = getPool();

  await pool.query(
    `INSERT INTO rank_snapshots (
      run_id, keyword_id, channel_id, collected_at, expires_at,
      scan_depth, scanned_count, school_rank, school_status,
      matched_url, matched_domain, result_total,
      request_count, provider_status, error_code
    ) VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,
      $10,$11,$12,
      $13,$14,$15
    )
    ON CONFLICT (run_id, keyword_id, channel_id) DO UPDATE SET
      collected_at = EXCLUDED.collected_at,
      expires_at = EXCLUDED.expires_at,
      scanned_count = EXCLUDED.scanned_count,
      school_rank = EXCLUDED.school_rank,
      school_status = EXCLUDED.school_status,
      matched_url = EXCLUDED.matched_url,
      matched_domain = EXCLUDED.matched_domain,
      result_total = EXCLUDED.result_total,
      request_count = EXCLUDED.request_count,
      provider_status = EXCLUDED.provider_status,
      error_code = EXCLUDED.error_code`,
    [
      runId,
      row.keywordId,
      row.channelId,
      row.collectedAt.toISOString(),
      expiresAt?.toISOString() ?? null,
      row.scanDepth,
      row.scannedCount,
      row.schoolRank,
      row.schoolStatus,
      row.matchedUrl,
      row.matchedDomain,
      row.resultTotal ?? null,
      row.requestCount,
      row.providerStatus,
      row.errorCode,
    ],
  );

  if (tos.aggregateKeep) {
    const day = row.collectedAt.toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO rank_daily (day, keyword_id, channel_id, school_rank, school_status)
       VALUES ($1::date, $2, $3, $4, $5)
       ON CONFLICT (day, keyword_id, channel_id) DO UPDATE SET
         school_rank = EXCLUDED.school_rank,
         school_status = EXCLUDED.school_status`,
      [day, row.keywordId, row.channelId, row.schoolRank, row.schoolStatus],
    );
  }
}

export async function deleteExpiredSnapshots(): Promise<number> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM rank_snapshots WHERE expires_at IS NOT NULL AND expires_at < now()`,
  );
  return rowCount ?? 0;
}

export async function listKeywords() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, phrase, is_brand, is_active, match_mode, created_at, updated_at
     FROM keywords ORDER BY id`,
  );
  return rows;
}

export async function listRecentRanks(limit = 50) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT s.id, s.collected_at, s.school_rank, s.school_status,
            s.matched_domain, s.matched_url, s.result_total,
            k.phrase, c.engine, c.tab
     FROM rank_snapshots s
     JOIN keywords k ON k.id = s.keyword_id
     JOIN channels c ON c.id = s.channel_id
     ORDER BY s.collected_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function resolveKeywordChannelIds(
  phrase: string,
  engine: string,
  tab = "web",
) {
  const pool = getPool();
  const kw = await pool.query<{ id: string }>(
    `SELECT id FROM keywords WHERE phrase = $1 LIMIT 1`,
    [phrase],
  );
  const ch = await pool.query<{ id: string }>(
    `SELECT id FROM channels WHERE engine = $1 AND tab = $2 AND device = 'desktop' LIMIT 1`,
    [engine, tab],
  );
  if (!kw.rows[0] || !ch.rows[0]) return null;
  return {
    keywordId: Number(kw.rows[0].id),
    channelId: Number(ch.rows[0].id),
  };
}

export function schemaHint() {
  return loadAppEnv().dbSchema;
}
