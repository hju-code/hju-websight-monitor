"use client";
import { useMemo, useState } from "react";
import { rankBy, sortBy, type ComparisonMetric, type RankableRow } from "../../stats/comparison-ranking";

const HOME = "혜전대학교";

/** University comparison with a dedicated rank column; headers toggle metric sort. */
export function ComparisonTable({ rows }: { rows: RankableRow[] }) {
  const [key, setKey] = useState<ComparisonMetric>("searchResults");
  const [direction, setDirection] = useState<"desc" | "asc">("desc");
  const activeRank = useMemo(() => rankBy(rows, key), [rows, key]);
  const sorted = useMemo(() => sortBy(rows, key, direction), [rows, key, direction]);

  function choose(next: ComparisonMetric) {
    if (key === next) setDirection((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setKey(next);
      setDirection("desc");
    }
  }

  const ariaSort = (metric: ComparisonMetric) =>
    key === metric ? (direction === "desc" ? "descending" : "ascending") : "none";
  const arrow = (metric: ComparisonMetric) =>
    key === metric ? (direction === "desc" ? "▼" : "▲") : "↕";

  return (
    <>
      <div className="sort-toolbar" role="group" aria-label="정렬 기준">
        <span className="muted">정렬</span>
        <button
          type="button"
          className={key === "searchResults" ? "chip is-active" : "chip"}
          onClick={() => choose("searchResults")}
        >
          검색 결과 {arrow("searchResults")}
        </button>
        <button
          type="button"
          className={key === "trend" ? "chip is-active" : "chip"}
          onClick={() => choose("trend")}
        >
          관심도 {arrow("trend")}
        </button>
      </div>
      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">순위</th>
              <th scope="col">대학</th>
              <th scope="col" aria-sort={ariaSort("searchResults")}>
                <button type="button" className="th-sort" onClick={() => choose("searchResults")}>
                  웹문서 검색 결과 <span aria-hidden="true">{arrow("searchResults")}</span>
                </button>
              </th>
              <th scope="col" aria-sort={ariaSort("trend")}>
                <button type="button" className="th-sort" onClick={() => choose("trend")}>
                  상대 검색 관심도 <span aria-hidden="true">{arrow("trend")}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const rank = activeRank.get(row.university);
              return (
                <tr key={row.university} className={row.university === HOME ? "is-home" : undefined}>
                  <td className="rank-cell">
                    {rank != null ? <strong>{rank}위</strong> : <span className="muted">—</span>}
                  </td>
                  <td>{row.university}</td>
                  <td>
                    {row.searchResults === null
                      ? "조회 불가"
                      : `${row.searchResults.toLocaleString("ko-KR")}건`}
                  </td>
                  <td>
                    {row.trend === null ? "조회 불가" : `${row.trend.toFixed(1)} / 100`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
