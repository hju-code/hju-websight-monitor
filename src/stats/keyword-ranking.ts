type KeywordCount = { engine: string; tab: string; resultTotal: number | null; providerStatus?: string | null };

/** Rank only within the same engine and search type; ties share a rank. */
export function rankKeywordsByCount<T extends KeywordCount>(rows: T[]): (T & { keywordRank: number | null })[] {
  const valid = (row: T) => row.resultTotal !== null && Number.isFinite(row.resultTotal) && row.resultTotal >= 0 && !["error", "quota", "tos_blocked", "unsupported", "skipped"].includes(row.providerStatus ?? "");
  const sorted = [...rows].sort((a, b) => {
    const group = a.engine.localeCompare(b.engine) || a.tab.localeCompare(b.tab);
    if (group) return group;
    if (valid(a) !== valid(b)) return valid(a) ? -1 : 1;
    return valid(a) && valid(b) ? b.resultTotal! - a.resultTotal! : 0;
  });
  let lastGroup = "", position = 0, previous: number | null = null, rank = 0;
  return sorted.map(row => {
    const group = `${row.engine}\0${row.tab}`;
    if (group !== lastGroup) { lastGroup = group; position = 0; previous = null; rank = 0; }
    if (!valid(row)) return { ...row, keywordRank: null };
    position++;
    if (row.resultTotal !== previous) { rank = position; previous = row.resultTotal; }
    return { ...row, keywordRank: rank };
  });
}
