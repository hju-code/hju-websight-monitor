import type { AuthDatabase } from "../auth/password-service";
import type { FileStoreData } from "./file-store";
import { validSnapshotTtl } from "../config/tos";

/** Import into an empty application state only; never imports legacy auth material. */
export async function importLegacyState(db: AuthDatabase, input: unknown): Promise<{ keywords: number; ranks: number }> {
  if (!input || typeof input !== "object") throw new Error("Invalid legacy file");
  const data = structuredClone(input) as FileStoreData;
  if (data.version !== 1 || !Array.isArray(data.keywords) || !Array.isArray(data.ranks) || !Array.isArray(data.assignees) || !Array.isArray(data.questions) || !Array.isArray(data.drafts) || !Array.isArray(data.knowledge) || !data.settings || !data.seq) throw new Error("Invalid legacy file structure");
  if (!validSnapshotTtl(data.settings.snapshot_ttl_days)) data.settings.snapshot_ttl_days = 21;
  data.settings.kin_auto_post = false; data.settings.google_enabled = false;
  const keywords = data.keywords;
  const ranks = data.ranks;
  data.users = []; data.sessions = []; data.magicLinks = []; data.ranks = []; data.runs = [];
  data.questions = data.questions.filter(q => q.id !== "kin-demo-1" && !q.id.startsWith("kin-stub-"));
  const questionIds = new Set(data.questions.map(q => q.id));
  data.drafts = data.drafts.filter(d => questionIds.has(d.questionId));
  data.knowledge = data.knowledge.filter(k => k.id !== "kb-dept-nursing" && k.id !== "kb-adm-2027");
  return db.transaction(async tx => {
    const inserted = await tx.query("INSERT INTO websight.app_state (id,data) VALUES (1,$1::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id", [JSON.stringify(data)]);
    if (!inserted.rows.length) throw new Error("Application state already exists; import refused");
    let keywordCount = 0; let rankCount = 0;
    for (const keyword of keywords) {
      if (typeof keyword.phrase !== "string" || !keyword.phrase.trim() || keyword.phrase.length > 300) throw new Error("Invalid keyword in legacy file");
      const mode = ["domain_or_name", "domain_only", "name_only"].includes(keyword.match_mode) ? keyword.match_mode : "domain_or_name";
      const result = await tx.query("INSERT INTO websight.keywords (phrase,is_brand,is_active,match_mode) VALUES ($1,$2,$3,$4) ON CONFLICT (phrase) DO NOTHING RETURNING id", [keyword.phrase.trim(), Boolean(keyword.is_brand), Boolean(keyword.is_active), mode]);
      keywordCount += result.rows.length;
    }
    for (const rank of ranks) {
      if (rank.source !== "live" || !["naver", "daum", "google"].includes(rank.engine)) continue;
      const collected = new Date(rank.collectedAt);
      if (!Number.isFinite(collected.getTime())) continue;
      const expires = new Date(collected.getTime() + 21 * 86400000);
      if (expires.getTime() <= Date.now()) continue;
      if (!["ok", "not_found", "error", "skipped"].includes(rank.schoolStatus)) continue;
      const ids = await tx.query("SELECT k.id AS keyword_id,c.id AS channel_id FROM websight.keywords k JOIN websight.channels c ON c.engine=$2 AND c.tab=$3 AND c.device='desktop' WHERE k.phrase=$1", [rank.phrase, rank.engine, rank.tab]);
      const id = ids.rows[0] as { keyword_id: string; channel_id: string } | undefined;
      if (!id) continue;
      const run = await tx.query("INSERT INTO websight.runs (triggered_by,started_at,finished_at,status,notes) VALUES ('test',$1,$1,'ok','legacy import') RETURNING id", [collected.toISOString()]);
      const runId = (run.rows[0] as { id: string }).id;
      await tx.query("INSERT INTO websight.rank_snapshots (run_id,keyword_id,channel_id,collected_at,expires_at,scan_depth,scanned_count,school_rank,school_status,matched_url,matched_domain,result_total,request_count,provider_status) VALUES ($1,$2,$3,$4,$5,100,0,$6,$7,$8,$9,$10,$11,$12)", [runId,id.keyword_id,id.channel_id,collected.toISOString(),expires.toISOString(),rank.schoolRank,rank.schoolStatus,rank.matchedUrl,rank.matchedDomain,rank.resultTotal,rank.requestCount,rank.providerStatus]);
      rankCount++;
    }
    return { keywords: keywordCount, ranks: rankCount };
  });
}
