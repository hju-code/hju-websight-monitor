import type {
  CollectRequest,
  CollectResult,
  Collector,
  OrganicHit,
} from "./types";

/**
 * Kakao Daum Search API — web tab only for P1.
 * Endpoint: GET https://dapi.kakao.com/v2/search/web
 * Top100: size=50 × page=1,2 (2 calls per keyword).
 *
 * Env placeholder:
 *   KAKAO_REST_API_KEY
 */
const DAUM_WEB_URL = "https://dapi.kakao.com/v2/search/web";

interface DaumDocument {
  title?: string;
  contents?: string;
  url?: string;
  datetime?: string;
}

interface DaumWebResponse {
  meta?: {
    total_count?: number;
    pageable_count?: number;
    is_end?: boolean;
  };
  documents?: DaumDocument[];
  msg?: string;
  code?: number;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

export class DaumKakaoCollector implements Collector {
  readonly id = "daum-kakao-web";

  supports(engine: CollectRequest["engine"], tab: CollectRequest["tab"]): boolean {
    return engine === "daum" && tab === "web";
  }

  async collect(req: CollectRequest): Promise<CollectResult> {
    const retainRaw = req.retainRaw ?? "none";
    const notes: string[] = [];

    if (!this.supports(req.engine, req.tab)) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "unsupported",
        errorMessage: `DaumKakaoCollector supports daum/web only (got ${req.engine}/${req.tab})`,
        meta: {
          requestCount: 0,
          provider: "kakao-daum-search",
          fetchedAt: new Date().toISOString(),
        },
      };
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "error",
        errorMessage: "Missing KAKAO_REST_API_KEY env placeholder",
        meta: {
          requestCount: 0,
          provider: "kakao-daum-search",
          fetchedAt: new Date().toISOString(),
          notes: ["Set campus-issued Kakao REST API key in .env"],
        },
      };
    }

    const depth = Math.min(Math.max(req.scanDepth, 1), 100);
    const pageSize = 50;
    const pagesNeeded = Math.ceil(depth / pageSize);
    const hits: OrganicHit[] = [];
    let requestCount = 0;
    let resultTotal: number | null = null;
    const fetchedAt = new Date().toISOString();

    try {
      for (let page = 1; page <= pagesNeeded; page++) {
        const url = new URL(DAUM_WEB_URL);
        url.searchParams.set("query", req.keyword);
        url.searchParams.set("size", String(pageSize));
        url.searchParams.set("page", String(page));

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `KakaoAK ${apiKey}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
        requestCount += 1;

        if (res.status === 429) {
          return {
            ok: false,
            hits,
            scanned: hits.length,
            status: "quota",
            errorMessage: "Kakao Daum API rate limited (429)",
            meta: {
              requestCount,
              provider: "kakao-daum-search",
              fetchedAt,
            },
          };
        }

        const body = (await res.json()) as DaumWebResponse;

        if (!res.ok) {
          return {
            ok: hits.length > 0,
            hits,
            scanned: hits.length,
            status: hits.length > 0 ? "partial" : "error",
            errorMessage:
              body.msg || `Kakao HTTP ${res.status} code=${body.code ?? "?"}`,
            meta: {
              requestCount,
              provider: "kakao-daum-search",
              fetchedAt,
            },
          };
        }

        if (
          resultTotal == null &&
          typeof body.meta?.total_count === "number" &&
          Number.isFinite(body.meta.total_count)
        ) {
          resultTotal = body.meta.total_count;
          notes.push(`daum.meta.total_count=${resultTotal}`);
        }

        const docs = body.documents ?? [];
        for (const doc of docs) {
          if (!doc.url) continue;
          if (hits.length >= depth) break;
          hits.push({
            rank: hits.length + 1,
            url: doc.url,
            title: stripHtml(doc.title ?? ""),
            snippet: doc.contents ? stripHtml(doc.contents) : undefined,
            publishedAt: doc.datetime,
          });
        }

        if (body.meta?.is_end || docs.length === 0 || hits.length >= depth) {
          break;
        }
      }

      if (retainRaw === "none") {
        notes.push(
          "retainRaw=none: API JSON not retained; title/snippet ephemeral for matcher only",
        );
      } else if (retainRaw === "ephemeral") {
        notes.push("retainRaw=ephemeral: in-process memory only");
      }

      return {
        ok: true,
        hits,
        scanned: hits.length,
        resultTotal,
        status: hits.length > 0 ? "ok" : "partial",
        meta: {
          requestCount,
          provider: "kakao-daum-search",
          fetchedAt,
          notes,
        },
      };
    } catch (err) {
      return {
        ok: false,
        hits,
        scanned: hits.length,
        status: hits.length > 0 ? "partial" : "error",
        errorMessage: err instanceof Error ? err.message : String(err),
        meta: {
          requestCount,
          provider: "kakao-daum-search",
          fetchedAt,
        },
      };
    }
  }
}
