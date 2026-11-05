"use client";
import { useMemo, useState } from "react";
import { rankBy, sortBy, type ComparisonMetric, type RankableRow } from "../../stats/comparison-ranking";

type SortKey = ComparisonMetric | "default";
const HOME = "혜전대학교";

/** University comparison with per-metric ranks; header buttons switch the sort. */
export function ComparisonTable({ rows }: { rows: RankableRow[] }) {
  const [key, setKey] = useState<SortKey>("default");
  const [direction, setDirection] = useState<"desc" | "asc">("desc");
  const searchRank = useMemo(() => rankBy(rows, "searchResults"), [rows]);
  const trendRank = useMemo(() => rankBy(rows, "trend"), [rows]);
  const sorted = key === "default" ? rows : sortBy(rows, key, direction);
  function choose(next: ComparisonMetric) {
    if (key === next) setDirection(d => (d === "desc" ? "asc" : "desc"));
    else { setKey(next); setDirection("desc"); }
  }
  const ariaSort = (metric: ComparisonMetric) => (key === metric ? (direction === "desc" ? "descending" : "ascending") : "none");
  const arrow = (metric: ComparisonMetric) => (key === metric ? (direction === "desc" ? "▼" : "▲") : "↕");
  const rank = (map: Map<string, number>, name: string) => { const r = map.get(name); return r ? <span className="rank-chip">{r}위</span> : null; };

  return <>
    <div className="sort-toolbar" role="group" aria-label="정렬 기준">
      <span className="muted">정렬</span>
      <button type="button" className={key === "default" ? "chip is-active" : "chip"} onClick={() => setKey("default")}>기본 순서</button>
      <button type="button" className={key === "searchResults" ? "chip is-active" : "chip"} onClick={() => choose("searchResults")}>검색 결과 {arrow("searchResults")}</button>
      <button type="button" className={key === "trend" ? "chip is-active" : "chip"} onClick={() => choose("trend")}>관심도 {arrow("trend")}</button>
    </div>
    <div className="table-scroll"><table className="comparison-table"><thead><tr>
      <th>대학</th>
      <th aria-sort={ariaSort("searchResults")}><button type="button" className="th-sort" onClick={() => choose("searchResults")}>웹문서 검색 결과 <span aria-hidden="true">{arrow("searchResults")}</span></button></th>
      <th aria-sort={ariaSort("trend")}><button type="button" className="th-sort" onClick={() => choose("trend")}>상대 검색 관심도 <span aria-hidden="true">{arrow("trend")}</span></button></th>
    </tr></thead><tbody>
      {sorted.map(row => <tr key={row.university} className={row.university === HOME ? "is-home" : undefined}>
        <td>{row.university}</td>
        <td>{row.searchResults === null ? "조회 불가" : <>{rank(searchRank, row.university)}{row.searchResults.toLocaleString("ko-KR")}건</>}</td>
        <td>{row.trend === null ? "조회 불가" : <>{rank(trendRank, row.university)}{row.trend.toFixed(1)} / 100</>}</td>
      </tr>)}
    </tbody></table></div>
  </>;
}
