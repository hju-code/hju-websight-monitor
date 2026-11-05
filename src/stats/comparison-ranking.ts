export type ComparisonMetric = "searchResults" | "trend";
export interface RankableRow { university: string; searchResults: number | null; trend: number | null }

/** Competition ranking (1, 2, 2, 4) by a metric, highest first; missing values get no rank. */
export function rankBy<T extends RankableRow>(rows: readonly T[], metric: ComparisonMetric): Map<string, number> {
  const values = rows.map(r => r[metric]).filter((v): v is number => v !== null);
  return new Map(rows.flatMap(r => {
    const value = r[metric];
    return value === null ? [] : [[r.university, values.filter(v => v > value).length + 1] as const];
  }));
}

/** Sorts by a metric; missing values always go last, ties keep the original order. */
export function sortBy<T extends RankableRow>(rows: readonly T[], metric: ComparisonMetric, direction: "desc" | "asc"): T[] {
  return [...rows].sort((a, b) => {
    const x = a[metric]; const y = b[metric];
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    return direction === "desc" ? y - x : x - y;
  });
}
