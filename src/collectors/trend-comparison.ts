export type TrendSeries = { title: string; data: { period: string; ratio: number }[] };

/** Align two single-period requests via a shared reference group, then set the maximum to 100. */
export function normalizeComparison(first: TrendSeries[], second: TrendSeries[]): Record<string, number> | null {
  const anchor = "혜전대학교";
  const a = first.find((x) => x.title === anchor)?.data;
  const b = second.find((x) => x.title === anchor)?.data;
  if (!a || !b || a.length !== 1 || b.length !== 1 || a[0].period !== b[0].period || a[0].ratio < 1 || b[0].ratio < 1 || !Number.isFinite(a[0].ratio) || !Number.isFinite(b[0].ratio)) return null;
  const values: Record<string, number> = {};
  for (const group of first) {
    if (group.data.length !== 1 || group.data[0].period !== a[0].period || !Number.isFinite(group.data[0].ratio) || group.data[0].ratio < 0) continue;
    values[group.title] = group.data[0].ratio;
  }
  for (const group of second) {
    if (group.title === anchor || group.data.length !== 1 || group.data[0].period !== a[0].period || !Number.isFinite(group.data[0].ratio) || group.data[0].ratio < 0) continue;
    values[group.title] = group.data[0].ratio * a[0].ratio / b[0].ratio;
  }
  const max = Math.max(...Object.values(values));
  if (!(max > 0)) return null;
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.round(value / max * 1000) / 10]));
}
