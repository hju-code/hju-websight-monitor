import { getLastPersistError, storeIsEphemeral, type RankRecord } from "./file-store";
import { listRanksFromStore, statsSummary } from "./store";
export type LiveStatsMode = "stored_live" | "fresh_live" | "sample";
export interface PublicStatsResult {
  mode: LiveStatsMode; enabledPlatforms: string[]; rows: RankRecord[]; totalSnapshots: number; sampleCount: number; liveCount: number; ephemeralStore: boolean; persistError: string | null; collectFailures: number; note?: string;
}
/** Read persisted results only; public page views never initiate provider requests. */
export async function getPublicStats(): Promise<PublicStatsResult> {
  const summary = await statsSummary();
  const stored = await listRanksFromStore(200);
  const live = stored.filter(r => r.source === "live");
  const byKey = new Map<string, RankRecord>();
  for (const row of live) { const key = `${row.phrase}|${row.engine}|${row.tab}`; if (!byKey.has(key)) byKey.set(key, row); }
  return {
    mode: live.length ? "stored_live" : "sample", enabledPlatforms: summary.enabledPlatforms,
    rows: live.length ? [...byKey.values()] : summary.rows, totalSnapshots: stored.length,
    sampleCount: summary.sampleCount, liveCount: live.length, ephemeralStore: storeIsEphemeral(),
    persistError: getLastPersistError(), collectFailures: 0,
    note: live.length ? undefined : "저장된 수집 결과가 없습니다. 관리자가 수집을 실행해 주세요.",
  };
}
