/**
 * Naver Search HTTP helpers — NAVER API HUB (NCP) primary.
 *
 * Docs:
 *   https://api.ncloud-docs.com/docs/naver-api-hub-overview
 *   https://guide.ncloud-docs.com/docs/apihub-migration
 *
 * Env (names unchanged):
 *   NAVER_CLIENT_ID / NAVER_CLIENT_SECRET
 *   NAVER_API_LEGACY=true → openapi.naver.com + X-Naver-* headers
 *     (old Developers keys only; sunset ~2027-06-30). Default: hub.
 */

export type NaverApiMode = "hub" | "legacy";

export type NaverSearchResource = "webkr" | "kin";

const HUB_BASE = "https://naverapihub.apigw.ntruss.com";
const LEGACY_BASE = "https://openapi.naver.com";

export function getNaverApiMode(): NaverApiMode {
  return process.env.NAVER_API_LEGACY === "true" ? "legacy" : "hub";
}

/** Absolute URL for a Search resource (no query string). */
export function naverSearchUrl(resource: NaverSearchResource): string {
  if (getNaverApiMode() === "legacy") {
    return `${LEGACY_BASE}/v1/search/${resource}.json`;
  }
  return `${HUB_BASE}/search/v1/${resource}`;
}

/** Auth headers for the active mode. Values come from NAVER_CLIENT_*. */
export function naverAuthHeaders(
  clientId: string,
  clientSecret: string,
): Record<string, string> {
  if (getNaverApiMode() === "legacy") {
    return {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    };
  }
  return {
    "X-NCP-APIGW-API-KEY-ID": clientId,
    "X-NCP-APIGW-API-KEY": clientSecret,
  };
}

/** Pull a human-readable error from HUB gateway or Search API bodies. */
export function naverErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.errorMessage === "string" && o.errorMessage) {
      return o.errorMessage;
    }
    const nested = o.error;
    if (nested && typeof nested === "object") {
      const e = nested as Record<string, unknown>;
      const msg = typeof e.message === "string" ? e.message : "";
      const code = typeof e.errorCode === "string" ? e.errorCode : "";
      const combined = [code, msg].filter(Boolean).join(" ");
      if (combined) return combined;
    }
    if (typeof o.errorCode === "string" && o.errorCode) {
      return o.errorCode;
    }
  }
  return `Naver HTTP ${status}`;
}
