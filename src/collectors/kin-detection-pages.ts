import type { CollectResult } from "./types";
import type { KinQuestion } from "../kin/types";
import { hitsToKinQuestions } from "./naver-kin";
import { needsAnswerReview } from "../kin/review-queue";

/** Confirmed status, not the mere presence of a saved draft, denotes a posted answer. */
export async function collectUnconfirmedQuestions(
  keywords: string[], existing: KinQuestion[],
  fetchPage: (keyword: string, start: number, size: number) => Promise<CollectResult>,
  options: { pageSize: number; maxStart: number } = { pageSize: 100, maxStart: 1000 },
) {
  const confirmed = new Set(existing.filter(q => !needsAnswerReview(q.status)).flatMap(q => [q.id, q.naverUrl]));
  const found = new Map<string, KinQuestion>();
  let failures = 0, attempts = 0;
  for (const keyword of keywords) {
    const keywordIds = new Set<string>();
    for (let start = 1; start <= options.maxStart && keywordIds.size < 30; start += options.pageSize) {
      attempts++;
      const result = await fetchPage(keyword, start, options.pageSize);
      if (!result.ok) { failures++; break; }
      for (const question of hitsToKinQuestions(result.hits)) {
        if (confirmed.has(question.id) || confirmed.has(question.naverUrl)) continue;
        if (keywordIds.size >= 30) break;
        keywordIds.add(question.id);
        const prior = found.get(question.id);
        if (prior) prior.matchedKeywords = [...new Set([...(prior.matchedKeywords ?? []), keyword])];
        else found.set(question.id, { ...question, matchedKeywords: [keyword] });
      }
      if (result.scanned < options.pageSize) break;
    }
  }
  return { questions: [...found.values()], failures, attempts };
}
