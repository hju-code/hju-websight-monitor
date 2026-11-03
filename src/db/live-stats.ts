/**
 * Public live Naver (etc.) ranks for Vercel — when file/PG persist is missing
 * or only sample fixtures remain, fetch once and return derived meta.
 */
import { runCollectJob } from "../jobs/collect-run";
import {
  getLastPersistError,
  storeIsEphemeral,
  type RankRecord,
} from "./file-store";
import { listRanksFromStore, statsSummary } from "./store";

export type LiveStatsMode = "stored_live" | "fresh_live" | "sample";

export interface PublicStatsResult {
  mode: LiveStatsMode;
  enabledPlatforms: string[];
  rows: RankRecord[];
  totalSnapshots: number;
  sampleCount: number;
  liveCount: number;
  ephemeralStore: boolean;
  persistError: string | null;
  collectFailures: number;
  note?: string;
}

function canCallNaver(): boolean {
  return Boolean(
    process.env.NAVER_CLIENT_ID?.trim() &&
      process.env.NAVER_CLIENT_SECRET?.trim(),
  );
}

function rowsFromCollectResults(
  results: Array<Record<string, unknown>>,
): RankRecord[] {
  const ts = new Date().toISOString();
  const rows: RankRecord[] = [];
  let id = 0;
  for (const r of results) {
    if (typeof r.phrase !== "string" || typeof r.engine !== "string") continue;
    if (r.status === "skipped" || r.note) continue;
    id += 1;
    const status = (r.school_status as RankRecord["schoolStatus"]) ?? "error";
    rows.push({
      id,
      runId: 0,
      phrase: r.phrase,
      engine: r.engine,
      tab: "web",
      collectedAt: ts,
      schoolRank:
        typeof r.school_rank === "number" ? r.school_rank : null,
      schoolStatus: status,
      matchedUrl:
        typeof r.matched_url === "string" ? r.matched_url : null,
      matchedDomain:
        typeof r.matched_domain === "string" ? r.matched_domain : null,
      resultTotal:
        typeof r.result_total === "number" ? r.result_total : null,
      requestCount:
        typeof r.requestCount === "number" ? r.requestCount : 0,
      providerStatus:
        typeof r.collectStatus === "string" ? r.collectStatus : null,
      source: "live",
    });
  }
  return rows;
}

/**
 * Prefer stored live rows; otherwise run a Naver collect for 혜전대학교
 * (and seed aliases when present) and return live derived ranks.
 */
export async function getPublicStats(opts?: {
  forceLive?: boolean;
  keywords?: string[];
}): Promise<PublicStatsResult> {
  const summary = await statsSummary();
  const stored = await listRanksFromStore(200);
  const liveStored = stored.filter((r) => r.source === "live");
  const base = {
    enabledPlatforms: summary.enabledPlatforms,
    totalSnapshots: summary.totalSnapshots,
    sampleCount: summary.sampleCount,
    liveCount: liveStored.length,
    ephemeralStore: storeIsEphemeral(),
    persistError: getLastPersistError(),
    collectFailures: 0,
  };

  if (!opts?.forceLive && liveStored.length > 0) {
    const byKey = new Map<string, RankRecord>();
    for (const r of liveStored) {
      const key = `${r.phrase}|${r.engine}|${r.tab}`;
      if (!byKey.has(key)) byKey.set(key, r);
    }
    return {
      ...base,
      mode: "stored_live",
      rows: [...byKey.values()],
      note: base.ephemeralStore
        ? "live rows from /tmp store (instance-local; cold start may reset)"
        : undefined,
    };
  }

  if (!canCallNaver()) {
    return {
      ...base,
      mode: "sample",
      rows: summary.rows,
      note: "NAVER_CLIENT_ID/SECRET 없음 — 샘플 순위만 표시",
    };
  }

  const keywords = opts?.keywords?.length
    ? opts.keywords
    : ["혜전대학교"];

  const out = await runCollectJob({
    persist: true,
    triggeredBy: "manual",
    keywords,
  });

  const liveRows = rowsFromCollectResults(
    out.results as Array<Record<string, unknown>>,
  );

  // Prefer freshly persisted store if write succeeded
  const after = await listRanksFromStore(200);
  const afterLive = after.filter((r) => r.source === "live");
  if (afterLive.length > 0) {
    const byKey = new Map<string, RankRecord>();
    for (const r of afterLive) {
      const key = `${r.phrase}|${r.engine}|${r.tab}`;
      if (!byKey.has(key)) byKey.set(key, r);
    }
    return {
      enabledPlatforms: out.enabled,
      rows: [...byKey.values()],
      totalSnapshots: after.length,
      sampleCount: after.filter((r) => r.source === "sample").length,
      liveCount: afterLive.length,
      ephemeralStore: storeIsEphemeral(),
      persistError: getLastPersistError(),
      collectFailures: out.failures,
      mode: "fresh_live",
      note: storeIsEphemeral()
        ? "fresh Naver collect · persisted to /tmp (ephemeral on Vercel)"
        : "fresh Naver collect · persisted to file store",
    };
  }

  return {
    enabledPlatforms: out.enabled,
    rows: liveRows.length ? liveRows : summary.rows,
    totalSnapshots: liveRows.length || summary.totalSnapshots,
    sampleCount: liveRows.length ? 0 : summary.sampleCount,
    liveCount: liveRows.length,
    ephemeralStore: storeIsEphemeral(),
    persistError: getLastPersistError(),
    collectFailures: out.failures,
    mode: liveRows.length ? "fresh_live" : "sample",
    note: liveRows.length
      ? "fresh Naver collect · in-memory only (disk persist failed)"
      : "collect returned no rows — showing samples",
  };
}
