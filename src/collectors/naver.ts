import {
  getNaverApiMode,
  naverAuthHeaders,
  naverErrorMessage,
  naverSearchUrl,
} from "./naver-client";
import type {
  CollectRequest,
  CollectResult,
  Collector,
  OrganicHit,
} from "./types";

/**
 * Naver Search API — web tab only for P1.
 * Primary (API HUB): GET https://naverapihub.apigw.ntruss.com/search/v1/webkr
 * Legacy (flag):     GET https://openapi.naver.com/v1/search/webkr.json
 * Top100: display=100, start=1 (1 call per keyword).
 *
 * Env placeholders (never commit real secrets):
 *   NAVER_CLIENT_ID
 *   NAVER_CLIENT_SECRET
 *   NAVER_API_LEGACY=true  (optional; old Developers keys until ~2027-06-30)
 *
 * ToS-safe: retainRaw defaults to none. title/snippet stay in memory for matcher only.
 */

interface NaverWebItem {
  title?: string;
  link?: string;
  description?: string;
}

interface NaverWebResponse {
  lastBuildDate?: string;
  total?: number;
  start?: number;
  display?: number;
  items?: NaverWebItem[];
  errorMessage?: string;
  errorCode?: string;
  error?: { errorCode?: string; message?: string; details?: string };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

export class NaverSearchCollector implements Collector {
  readonly id = "naver-search-web";

  supports(engine: CollectRequest["engine"], tab: CollectRequest["tab"]): boolean {
    return engine === "naver" && tab === "web";
  }

  async collect(req: CollectRequest): Promise<CollectResult> {
    const retainRaw = req.retainRaw ?? "none";
    const notes: string[] = [];
    const apiMode = getNaverApiMode();

    if (!this.supports(req.engine, req.tab)) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "unsupported",
        errorMessage: `NaverSearchCollector supports naver/web only (got ${req.engine}/${req.tab})`,
        meta: {
          requestCount: 0,
          provider: "naver-search",
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
        errorMessage:
          "Missing NAVER_CLIENT_ID / NAVER_CLIENT_SECRET env placeholders",
        meta: {
          requestCount: 0,
          provider: "naver-search",
          fetchedAt: new Date().toISOString(),
          notes: [
            "Set campus-issued NAVER API HUB credentials in .env (console.ncloud.com)",
          ],
        },
      };
    }

    const display = Math.min(Math.max(req.scanDepth, 1), 100);
    const url = new URL(naverSearchUrl("webkr"));
    url.searchParams.set("query", req.keyword);
    url.searchParams.set("display", String(display));
    url.searchParams.set("start", "1");

    const fetchedAt = new Date().toISOString();
    notes.push(`naverApiMode=${apiMode}`);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: naverAuthHeaders(clientId, clientSecret),
        cache: "no-store",
      });

      if (res.status === 429) {
        return {
          ok: false,
          hits: [],
          scanned: 0,
          status: "quota",
          errorMessage: "Naver API rate limited (429)",
          meta: {
            requestCount: 1,
            provider: "naver-search",
            fetchedAt,
            notes,
          },
        };
      }

      const body = (await res.json()) as NaverWebResponse;

      if (!res.ok) {
        return {
          ok: false,
          hits: [],
          scanned: 0,
          status: "error",
          errorMessage: naverErrorMessage(body, res.status),
          meta: {
            requestCount: 1,
            provider: "naver-search",
            fetchedAt,
            notes,
          },
        };
      }

      const items = body.items ?? [];
      const hits: OrganicHit[] = items
        .map((item, i): OrganicHit | null => {
          if (!item.link) return null;
          return {
            rank: i + 1,
            url: item.link,
            title: stripHtml(item.title ?? ""),
            snippet: item.description
              ? stripHtml(item.description)
              : undefined,
          };
        })
        .filter((h): h is OrganicHit => h !== null);

      if (retainRaw === "none") {
        notes.push(
          "retainRaw=none: API JSON not retained; title/snippet ephemeral for matcher only",
        );
      } else if (retainRaw === "ephemeral") {
        notes.push("retainRaw=ephemeral: in-process memory only; do not dump to disk/DB");
      } else {
        notes.push(
          "retainRaw=history_ttl: NOT recommended under P1 TOS_MODE=derived_meta",
        );
      }

      return {
        ok: true,
        hits,
        scanned: hits.length,
        status: hits.length > 0 ? "ok" : "partial",
        meta: {
          requestCount: 1,
          provider: "naver-search",
          fetchedAt,
          notes,
        },
      };
    } catch (err) {
      return {
        ok: false,
        hits: [],
        scanned: 0,
        status: "error",
        errorMessage: err instanceof Error ? err.message : String(err),
        meta: {
          requestCount: 1,
          provider: "naver-search",
          fetchedAt,
          notes,
        },
      };
    }
  }
}
