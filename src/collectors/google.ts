import type { CollectRequest, CollectResult, Collector } from "./types";

/**
 * Google PSE / Custom Search JSON — STUB / DEFERRED (assumption A2).
 *
 * Reasons (P0/P1):
 * - New PSE customer signup closed; product sunset noted for 2027-01-01
 * - Campus existing CSE/API key not confirmed
 * - P1 scope = Naver + Daum web only
 *
 * Activation later: set GOOGLE_ENABLED=true and implement collect() when a campus key exists.
 */
export class GooglePseCollector implements Collector {
  readonly id = "google-pse-stub";

  supports(engine: CollectRequest["engine"], tab: CollectRequest["tab"]): boolean {
    if (process.env.GOOGLE_ENABLED === "true") {
      // Still unsupported until real implementation lands.
      return false;
    }
    return false;
  }

  async collect(req: CollectRequest): Promise<CollectResult> {
    return {
      ok: false,
      hits: [],
      scanned: 0,
      status: "unsupported",
      errorMessage:
        "Google PSE channel deferred (P1 assumption A2). Keep GOOGLE_ENABLED=false until campus CSE key is confirmed.",
      meta: {
        requestCount: 0,
        provider: "google-pse-stub",
        fetchedAt: new Date().toISOString(),
        notes: [
          "Stub only — no HTTP calls",
          "Investigate existing GCP/CSE keys on campus before enabling",
        ],
      },
    };
  }
}
