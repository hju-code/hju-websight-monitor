import { UniversityComparison } from "./UniversityComparison";
import { getPublicStats } from "../../db/live-stats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Public view of persisted search data. */
export default async function PublicStatsPage() {
  const summary = await getPublicStats().catch(() => null);
  if (!summary) return <><div className="dashboard-intro"><p>혜전대학교</p><h1>검색 현황</h1><span>충청권 전문대학의 검색 관심도를 비교하세요.</span></div><section className="panel"><h2>검색 순위 요약</h2><p>저장된 검색 결과를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.</p></section><UniversityComparison /></>;
  const isLive = summary.mode === "fresh_live" || summary.mode === "stored_live";

  return (
    <>
      <div className="dashboard-intro"><p>혜전대학교</p><h1>검색 현황</h1><span>우리 대학의 검색 결과와 충청권 전문대학의 관심도를 살펴보세요.</span></div>

      <section className="panel">
        <h2>검색 순위 요약</h2>
        <p className="muted">저장된 수집 결과 {summary.totalSnapshots.toLocaleString("ko-KR")}건{summary.sampleCount > 0 && !isLive ? " · 예시 데이터 포함" : ""}</p>
        {summary.note ? <p className="muted">{summary.note}</p> : null}
        <table>
          <thead>
            <tr>
              <th>키워드</th>
              <th>사이트</th>
              <th>순위</th>
              <th>검색결과 건수</th>
              <th>상태</th>
              <th>도메인</th>
              <th>수집 시각</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  저장된 검색 결과가 없습니다. 관리자가 수집을 실행하면 여기에 표시됩니다.
                </td>
              </tr>
            ) : (
              summary.rows.map((r) => (
                <tr key={`${r.phrase}-${r.engine}-${r.tab}-${r.id}`}>
                  <td>{r.phrase}</td>
                  <td>
                    {r.engine} / {r.tab}
                  </td>
                  <td>
                    {r.schoolRank != null ? (
                      <strong>{r.schoolRank}</strong>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {r.resultTotal != null ? (
                      <strong>{r.resultTotal.toLocaleString("ko-KR")}</strong>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.schoolStatus === "ok" ? "ok" : "warn"
                      }`}
                    >
                      {{ ok: "확인", not_found: "미발견", error: "오류", skipped: "미수집" }[r.schoolStatus]}
                    </span>
                    {r.source === "sample" ? (
                      <>
                        {" "}
                        <span className="badge">예시</span>
                      </>
                    ) : null}
                    {r.source === "live" ? (
                      <>
                        {" "}
                        <span className="badge ok">수집</span>
                      </>
                    ) : null}
                  </td>
                  <td className="muted">{r.matchedDomain ?? "—"}</td>
                  <td className="muted">{new Date(r.collectedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <UniversityComparison />

      <section className="panel">
        <h2>안내</h2>
        <ul className="checklist">
          <li>
            원문(title/snippet)은 저장하지 않으며 파생 <strong>순위</strong>와
            네이버 webkr <code>total</code> 기반 <strong>검색결과 건수</strong>
            만 표시합니다. 검색 횟수나 방문 수가 아닙니다.
          </li>
          <li>통계는 관리자가 수집한 결과를 표시합니다.</li>
          <li>지식iN 답변 검토는 로그인 후 이용할 수 있습니다.</li>
        </ul>
      </section>
    </>
  );
}
