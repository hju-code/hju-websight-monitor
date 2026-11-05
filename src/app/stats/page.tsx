import { PageHeader } from "../../components/PageHeader";
import { UniversityComparison } from "./UniversityComparison";
import { CollectionBar } from "./CollectionBar";
import { getPublicStats } from "../../db/live-stats";
import { rankKeywordsByCount } from "../../stats/keyword-ranking";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Soft row tint key for daum / naver / other engines. */
function siteGroupTone(engine: string): "daum" | "naver" | "other" {
  const key = engine.trim().toLowerCase();
  if (key === "daum") return "daum";
  if (key === "naver") return "naver";
  return "other";
}

/** Public view of persisted search data. */
export default async function PublicStatsPage() {
  const summary = await getPublicStats().catch(() => null);
  if (!summary) return <><PageHeader eyebrow="혜전대학교" title="검색 현황">충청권 전문대학의 검색 관심도를 비교하세요.</PageHeader><CollectionBar /><section className="panel"><h2>검색 순위 요약</h2><p>저장된 검색 결과를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.</p></section><UniversityComparison /></>;
  const isLive = summary.mode === "fresh_live" || summary.mode === "stored_live";
  const rankedRows = rankKeywordsByCount(summary.rows);

  return (
    <>
      <PageHeader eyebrow="혜전대학교" title="검색 현황">우리 대학의 검색 결과와 충청권 전문대학의 관심도를 살펴보세요.</PageHeader>
      <CollectionBar />

      <section className="panel">
        <h2>키워드별 검색결과 비교</h2>
        <p className="muted">저장된 수집 결과 {summary.totalSnapshots.toLocaleString("ko-KR")}건{summary.sampleCount > 0 && !isLive ? " · 예시 데이터 포함" : ""}</p>
        <p className="muted">같은 검색 사이트와 유형의 키워드를 검색결과 건수 순으로 비교합니다. 결과가 서로 겹칠 수 있으며 실제 검색 횟수나 인기도 순위는 아닙니다.</p>
        {summary.note ? <p className="muted">{summary.note}</p> : null}
        <table>
          <thead>
            <tr>
              <th>키워드</th>
              <th>사이트</th>
              <th>결과 건수 순위</th>
              <th>검색결과 건수</th>
              <th>상태</th>
              <th>수집 시각</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  저장된 검색 결과가 없습니다. 관리자가 수집을 실행하면 여기에 표시됩니다.
                </td>
              </tr>
            ) : (
              rankedRows.map((r, index) => {
                const prev = index > 0 ? rankedRows[index - 1] : null;
                const groupStart = !prev || prev.engine !== r.engine || prev.tab !== r.tab;
                const siteTone = siteGroupTone(r.engine);
                return (
                  <tr
                    key={`${r.phrase}-${r.engine}-${r.tab}-${r.id}`}
                    className={`site-group site-group--${siteTone}${groupStart ? " site-group--start" : ""}`}
                    data-site={r.engine}
                  >
                    <td>{r.phrase}</td>
                    <td>
                      <span className="site-label">{r.engine} / {r.tab}</span>
                    </td>
                    <td>
                      {r.keywordRank != null ? (
                        <strong>{r.keywordRank}위</strong>
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
                    <td className="muted">{new Date(r.collectedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <UniversityComparison />

      <section className="panel">
        <h2>안내</h2>
        <ul className="checklist">
          <li>
            키워드 순위는 네이버 웹문서 검색결과 건수를 비교한 값입니다. 검색 횟수나 방문 수가 아닙니다.
          </li>
          <li>통계는 관리자가 수집한 결과를 표시합니다.</li>
          <li>지식iN 답변 검토는 로그인 후 이용할 수 있습니다.</li>
        </ul>
      </section>
    </>
  );
}
