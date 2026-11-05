/** Today's date in Korea as YYYY-MM-DD, the format used by date inputs. */
export function seoulToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function validQuestionDate(value: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function isWithinQuestionDates(value: string | undefined, start: string, end: string): boolean {
  if (!start && !end) return true;
  return !!value && (!start || value >= start) && (!end || value <= end);
}
