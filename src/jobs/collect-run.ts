import "dotenv/config";
import { collectWeb } from "../collectors";
import { getEnabledPlatforms } from "../db/store";
import { appendRankSnapshots } from "../db/store";
import { SEED_KEYWORDS } from "../config/seeds";
import { matchSchool, toDerivedMeta } from "../matcher/school";
import {
  createRun,
  finishRun,
  insertRankSnapshot,
  resolveKeywordChannelIds,
} from "../db/repository";
import { loadAppEnv } from "../config/env";

/**
 * Manual / scheduled collect job.
 * Only engines mapped from enabled_platforms (admin checkboxes) run.
 * Persists derived meta only; discards title/snippet after match.
 *
 * Platforms without live collectors are skipped (not fatal).
 */

const PLATFORM_TO_ENGINE: Record<string, "naver" | "daum" | null> = {
  naver_web: "naver",
  daum_web: "daum",
  youtube: null,
  instagram: null,
  x: null,
  tiktok: null,
  facebook: null,
};

export async function runCollectJob(opts?: {
  persist?: boolean;
  triggeredBy?: "schedule" | "manual" | "test";
  keywords?: string[];
}) {
  const persist = opts?.persist ?? true;
  const triggeredBy = opts?.triggeredBy ?? "manual";
  const phrases = opts?.keywords ?? SEED_KEYWORDS.map((k) => k.phrase);
  const enabled = await getEnabledPlatforms();
  const engines = [
    ...new Set(
      enabled
        .map((id) => PLATFORM_TO_ENGINE[id])
        .filter((e): e is "naver" | "daum" => e != null),
    ),
  ];
  const skippedPlatforms = enabled.filter((id) => PLATFORM_TO_ENGINE[id] === null);

  const usePg = Boolean(loadAppEnv().databaseUrl);
  let runId: number | null = null;
  if (persist && usePg) {
    try {
      runId = await createRun(triggeredBy);
    } catch {
      // fall through to file store
    }
  }

  const results: Array<Record<string, unknown>> = [];
  const fileRows: Parameters<typeof appendRankSnapshots>[0] = [];
  let failures = 0;

  if (engines.length === 0) {
    return {
      runId,
      results: [
        {
          note: "활성 검색 웹 플랫폼 없음 — /admin/settings 에서 naver_web/daum_web 체크",
          enabled,
          skippedPlatforms,
        },
      ],
      failures: 0,
      enabled,
      skippedPlatforms,
    };
  }

  for (const phrase of phrases) {
    for (const engine of engines) {
      const collect = await collectWeb(engine, phrase, 100);
      const match = matchSchool(collect.hits);
      const derived = toDerivedMeta(match);

      const hitsDiscarded = collect.hits.length;
      collect.hits.length = 0;

      const resultTotal =
        typeof collect.resultTotal === "number" &&
        Number.isFinite(collect.resultTotal)
          ? collect.resultTotal
          : null;

      const row = {
        phrase,
        engine,
        collectStatus: collect.status,
        requestCount: collect.meta.requestCount,
        scanned: collect.scanned,
        result_total: resultTotal,
        hitsDiscarded,
        ...derived,
      };
      results.push(row);

      if (!collect.ok) failures += 1;

      const schoolStatus =
        collect.ok || collect.status === "partial"
          ? derived.school_status
          : ("error" as const);

      if (persist && runId !== null) {
        const ids = await resolveKeywordChannelIds(phrase, engine, "web");
        if (!ids) {
          failures += 1;
          results.push({
            phrase,
            engine,
            error: "keyword/channel id not found — apply db/001 seed",
          });
        } else {
          await insertRankSnapshot(runId, {
            keywordId: ids.keywordId,
            channelId: ids.channelId,
            collectedAt: new Date(collect.meta.fetchedAt),
            scanDepth: 100,
            scannedCount: collect.scanned,
            schoolRank: derived.school_rank,
            schoolStatus,
            matchedUrl: derived.matched_url,
            matchedDomain: derived.matched_domain,
            resultTotal,
            requestCount: collect.meta.requestCount,
            providerStatus: collect.status,
            errorCode: collect.errorMessage ?? null,
          });
        }
      } else if (persist) {
        fileRows.push({
          runId: 0,
          phrase,
          engine,
          tab: "web",
          collectedAt: collect.meta.fetchedAt,
          schoolRank: derived.school_rank,
          schoolStatus,
          matchedUrl: derived.matched_url,
          matchedDomain: derived.matched_domain,
          resultTotal,
          requestCount: collect.meta.requestCount,
          providerStatus: collect.status,
          source:
            collect.status === "error" && !process.env.NAVER_CLIENT_ID
              ? "dry-run"
              : "live",
        });
      }
    }
  }

  for (const sp of skippedPlatforms) {
    results.push({
      platform: sp,
      status: "skipped",
      note: "체크됨·실수집 미구현 또는 키 없음 — 스킵",
    });
  }

  if (persist && runId !== null) {
    const status =
      failures === 0 ? "ok" : failures < results.length ? "partial" : "failed";
    await finishRun(runId, status);
  } else if (persist && fileRows.length > 0) {
    await appendRankSnapshots(fileRows);
  }

  return { runId, results, failures, enabled, skippedPlatforms };
}

async function main() {
  const persist = process.env.DRY_RUN !== "1";
  const out = await runCollectJob({ persist, triggeredBy: "manual" });
  console.log(JSON.stringify(out, null, 2));
}

const isDirect =
  typeof process !== "undefined" &&
  process.argv[1] &&
  /collect-run\.(ts|js|mjs|cjs)$/.test(process.argv[1]);

if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
