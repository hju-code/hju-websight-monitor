import { unstable_cache } from "next/cache";
import { collectUniversityComparison } from "../../collectors/university-comparison";

const cachedComparison = unstable_cache(async () => {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return collectUniversityComparison({ clientId, clientSecret });
}, ["university-comparison-v1"], { revalidate: 3600 });

export async function UniversityComparison() {
  const comparison = await cachedComparison();
  return <section className="panel">
    <h2>충청권 전문대학 비교</h2>
    <p className="muted">네이버 웹문서 검색 결과 건수와 전월 통합검색 상대 관심도를 각각 표시합니다. 결과 건수는 검색 횟수나 홈페이지 방문 수가 아닙니다.</p>
    {!comparison ? <p>네이버 API 설정 후 비교할 수 있습니다.</p> : <>
      <p className="muted">관심도 기준: {comparison.periodStart} ~ {comparison.periodEnd} · 수집: {new Date(comparison.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · 최대 1시간 간격 갱신</p>
      <div className="table-scroll"><table><thead><tr><th>대학</th><th>웹문서 검색 결과</th><th>상대 검색 관심도</th></tr></thead><tbody>
      {comparison.rows.map(row => <tr key={row.university}><td>{row.university}</td><td>{row.searchResults === null ? "조회 불가" : `${row.searchResults.toLocaleString("ko-KR")}건`}</td><td>{row.trend === null ? "조회 불가" : `${row.trend.toFixed(1)} / 100`}</td></tr>)}
      </tbody></table></div>
      <p className="muted">관심도는 두 요청에 공통으로 포함한 혜전대학교를 기준으로 보정한 상대값입니다. 검색 횟수나 방문 수가 아니며 반올림 오차가 있을 수 있습니다. 기준값이 너무 작거나 누락되면 비교하지 않습니다.</p>
      {!comparison.trendAvailable && <p role="status">상대 관심도를 가져오지 못했습니다. 데이터랩 API 권한과 제공 상태를 확인해 주세요.</p>}
    </>}
  </section>;
}
