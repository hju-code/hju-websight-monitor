import { unstable_cache } from "next/cache";
import { collectUniversityComparison } from "../../collectors/university-comparison";
import { ComparisonTable } from "./ComparisonTable";

/** Cache only successful fetches. Missing keys are checked outside so null is never stored. */
const cachedComparison = unstable_cache(
  async () => {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("NAVER API credentials are not configured");
    }
    return collectUniversityComparison({ clientId, clientSecret });
  },
  ["university-comparison-v2"],
  { revalidate: 7 * 24 * 60 * 60 },
);

export async function UniversityComparison() {
  const configured = Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
  const comparison = configured ? await cachedComparison().catch(() => null) : null;
  return (
    <section className="panel">
      <h2>충청권 전문대학 비교</h2>
      <p className="muted">
        네이버 웹문서 검색 결과 건수와 전월 통합검색 상대 관심도를 각각 표시합니다. 결과 건수는 검색
        횟수나 홈페이지 방문 수가 아닙니다.
      </p>
      {!comparison ? (
        <p>{configured ? "비교 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요." : "네이버 API 설정 후 비교할 수 있습니다."}</p>
      ) : (
        <>
          <p className="muted">
            관심도 기준: {comparison.periodStart} ~ {comparison.periodEnd} · 수집:{" "}
            {new Date(comparison.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · 기본
            갱신 주기: 1주일
          </p>
          <ComparisonTable rows={comparison.rows} />
          <p className="muted">
            관심도는 두 요청에 공통으로 포함한 혜전대학교를 기준으로 보정한 상대값입니다. 검색 횟수나
            방문 수가 아니며 반올림 오차가 있을 수 있습니다. 기준값이 너무 작거나 누락되면 비교하지
            않습니다. 기본 정렬은 웹문서 검색 결과 내림차순이며, 열 머리글이나 정렬 버튼으로 관심도
            기준으로 바꿀 수 있습니다. 순위는 현재 정렬 지표에서 값이 큰 순서이고, 같은 값은 같은
            순위로 표시합니다.
          </p>
          {!comparison.trendAvailable && (
            <p role="status">
              상대 관심도를 가져오지 못했습니다. 데이터랩 API 권한과 제공 상태를 확인해 주세요.
            </p>
          )}
        </>
      )}
    </section>
  );
}
