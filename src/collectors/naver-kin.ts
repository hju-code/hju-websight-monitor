import { mentionsHyejeon, normalizeSchoolMention } from "../kin/aliases";
import type { KinQuestion } from "../kin/types";
import type { CollectRequest, CollectResult, Collector } from "./types";

/**
 * Naver Kin (지식iN) detector — P1 scaffold / stub.
 *
 * Product use: find NEW questions mentioning 혜전대(해전대=혜전대), not SERP rank.
 * Official Search API tab: /v1/search/kin.json (P0 matrix — Top100 possible).
 *
 * IMPORTANT:
 * - Detection only. NEVER posts answers.
 * - Full Kin answer posting API is out of scope; admin pastes via browser link.
 */
const NAVER_KIN_URL = "https://openapi.naver.com/v1/search/kin.json";

export class NaverKinDetector implements Collector {
  readonly id = "naver-kin-detect";

  supports(engine: CollectRequest["engine"], tab: CollectRequest["tab"]): boolean {
    return engine === "naver" && tab === "kin";
  }

  /**
   * Collect organic Kin hits for matching (ephemeral). Prefer detectQuestions() for product flow.
   */
  async collect(req: CollectRequest): Promise<CollectResult> {
    if (!this.supports(req.engine, req.tab)) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "unsupported",
        errorMessage: "NaverKinDetector supports naver/kin only",
        meta: {
          requestCount: 0,
          provider: "naver-kin",
          fetchedAt: new Date().toISOString(),
        },
      };
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "error",
        errorMessage: "Missing NAVER_CLIENT_ID / NAVER_CLIENT_SECRET",
        meta: {
          requestCount: 0,
          provider: "naver-kin",
          fetchedAt: new Date().toISOString(),
          notes: ["Stub path ready — keys required for live detect"],
        },
      };
    }

    const display = Math.min(Math.max(req.scanDepth, 1), 100);
    const url = new URL(NAVER_KIN_URL);
    url.searchParams.set("query", req.keyword);
    url.searchParams.set("display", String(display));
    url.searchParams.set("sort", "date");

    const fetchedAt = new Date().toISOString();
    try {
      const res = await fetch(url.toString(), {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        cache: "no-store",
      });
      const body = (await res.json()) as {
        items?: Array<{ title?: string; link?: string; description?: string }>;
        errorMessage?: string;
      };
      if (!res.ok) {
        return {
          ok: false,
          hits: [],
          scanned: 0,
          status: "error",
          errorMessage: body.errorMessage || `HTTP ${res.status}`,
          meta: { requestCount: 1, provider: "naver-kin", fetchedAt },
        };
      }
      const hits = (body.items ?? [])
        .map((item, i) => {
          if (!item.link) return null;
          const title = (item.title ?? "").replace(/<[^>]*>/g, "");
          const snippet = (item.description ?? "").replace(/<[^>]*>/g, "");
          return {
            rank: i + 1,
            url: item.link,
            title,
            snippet,
          };
        })
        .filter((h): h is NonNullable<typeof h> => h !== null);

      return {
        ok: true,
        hits,
        scanned: hits.length,
        status: "ok",
        meta: {
          requestCount: 1,
          provider: "naver-kin",
          fetchedAt,
          notes: [
            "Kin detect only — auto-post DISABLED",
            "retainRaw=none recommended after admin maps to KinQuestion",
          ],
        },
      };
    } catch (err) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "error",
        errorMessage: err instanceof Error ? err.message : String(err),
        meta: { requestCount: 1, provider: "naver-kin", fetchedAt },
      };
    }
  }
}

/** Map collect hits → KinQuestion stubs (in-memory). */
export function hitsToKinQuestions(
  hits: Array<{ rank: number; url: string; title: string; snippet?: string }>,
): KinQuestion[] {
  const now = new Date().toISOString();
  return hits
    .filter((h) => mentionsHyejeon(`${h.title} ${h.snippet ?? ""}`))
    .map((h, i) => ({
      id: `kin-stub-${i}-${Buffer.from(h.url).toString("base64url").slice(0, 12)}`,
      naverUrl: h.url,
      title: normalizeSchoolMention(h.title),
      questionText: normalizeSchoolMention(h.snippet ?? h.title),
      detectedAt: now,
      status: "new" as const,
      matchedAliases: ["혜전대"],
    }));
}
