const DAY_MS = 24 * 60 * 60 * 1000;
// A one-day margin allows the once-daily cleanup to run before 21 days.
export const KIN_RETENTION_DAYS = 20;

export function purgeExpiredKinRecords<Q extends { id: string; detectedAt: string }, D extends { questionId: string; createdAt: string }>(questions: Q[], drafts: D[], now = Date.now()) {
  const cutoff = now - KIN_RETENTION_DAYS * DAY_MS;
  const expired = (date: string) => { const value = Date.parse(date); return !Number.isFinite(value) || value <= cutoff; };
  const expiredIds = new Set(questions.filter(q => expired(q.detectedAt)).map(q => q.id));
  return {
    questions: questions.filter(q => !expiredIds.has(q.id)),
    drafts: drafts.filter(d => !expiredIds.has(d.questionId) && !expired(d.createdAt)),
  };
}
