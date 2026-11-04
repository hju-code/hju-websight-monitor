import { getNaverApiMode, naverAuthHeaders, naverSearchUrl } from "./naver-client";
import { normalizeComparison, type TrendSeries } from "./trend-comparison";
export const UNIVERSITIES = ["혜전대학교", "백석문화대학교", "아주자동차대학교", "신성대학교", "연암대학교", "충남도립대학교"] as const;
export interface ComparisonRow { university: string; searchResults: number | null; trend: number | null }
export interface UniversityComparison { rows: ComparisonRow[]; periodStart: string; periodEnd: string; fetchedAt: string; trendAvailable: boolean }
function previousMonth(now: Date) {
  const korea = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const first = new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth(), 0));
  return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
}
export async function collectUniversityComparison(opts: { clientId: string; clientSecret: string; now?: Date; fetcher?: typeof fetch }): Promise<UniversityComparison> {
  const now = opts.now ?? new Date(); const { start, end } = previousMonth(now);
  const fetcher = opts.fetcher ?? fetch; const headers = naverAuthHeaders(opts.clientId, opts.clientSecret);
  async function search(name: string): Promise<number | null> {
    try {
      const url = new URL(naverSearchUrl("webkr")); url.searchParams.set("query", name); url.searchParams.set("display", "1");
      const response = await fetcher(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      const body = await response.json() as { total?: unknown };
      return typeof body.total === "number" && Number.isSafeInteger(body.total) && body.total >= 0 ? body.total : null;
    } catch { return null; }
  }
  async function trend(names: readonly string[]): Promise<TrendSeries[] | null> {
    try {
      const url = getNaverApiMode() === "legacy" ? "https://openapi.naver.com/v1/datalab/search" : "https://naverapihub.apigw.ntruss.com/search-trend/v1/search";
      const response = await fetcher(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000), body: JSON.stringify({ startDate: start, endDate: end, timeUnit: "month", keywordGroups: names.map(name => ({ groupName: name, keywords: [name] })) }) });
      if (!response.ok) return null;
      const body = await response.json() as { results?: unknown };
      if (!Array.isArray(body.results)) return null;
      return body.results.filter((x): x is TrendSeries => !!x && typeof x.title === "string" && Array.isArray(x.data) && x.data.every((p: unknown) => !!p && typeof p === "object" && typeof (p as { period?: unknown }).period === "string" && typeof (p as { ratio?: unknown }).ratio === "number"));
    } catch { return null; }
  }
  const [counts, first, second] = await Promise.all([Promise.all(UNIVERSITIES.map(search)), trend(UNIVERSITIES.slice(0, 5)), trend([UNIVERSITIES[0], UNIVERSITIES[5]])]);
  const values = first && second && [...first, ...second].every(group => group.data.every(point => point.period === start)) ? normalizeComparison(first, second) : null;
  return { periodStart: start, periodEnd: end, fetchedAt: now.toISOString(), trendAvailable: !!values && UNIVERSITIES.every(name => values[name] !== undefined), rows: UNIVERSITIES.map((university, i) => ({ university, searchResults: counts[i], trend: values?.[university] ?? null })) };
}
