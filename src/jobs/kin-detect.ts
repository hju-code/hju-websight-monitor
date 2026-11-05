import { detectionOutcome } from "../collectors/detection-outcome";
import { NaverKinDetector } from "../collectors/naver-kin";
import { collectUnconfirmedQuestions } from "../collectors/kin-detection-pages";
import { deleteExpiredKinRecords, getLastKinDetection, listKeywordsFromStore, listQuestions, recordKinDetection, upsertQuestions } from "../db/store";
import type { KinQuestion } from "../kin/types";
import { withKinDetectionLock } from "./exclusive";

function stubQuestions(): KinQuestion[] {
  const now = new Date().toISOString();
  return [
    {
      id: `kin-stub-${Date.now()}`,
      naverUrl: "https://kin.naver.com/qna/detail.naver?d1id=11&dirId=1108&docId=stub",
      title: "혜전대 수시 전형 일정이 궁금해요",
      questionText:
        "해전대(=혜전대) 2027 수시 원서 접수 기간과 간호학과 모집 요강이 어디에 있나요?",
      detectedAt: now,
      status: "new",
      matchedAliases: ["해전대", "혜전대"],
      matchedKeywords: ["혜전대학교", "혜전대"],
    },
  ];
}

export type KinDetectionResult =
  | { ok: true; mode: "live" | "stub"; partial: boolean; failures: number; detected: number; added: number; lastRunAt: string }
  | { ok: false; reason: "not_configured" | "failed" | "busy" }
  | { ok: false; reason: "cooldown"; retryAfterMinutes: number };

/** Minutes left before another run is allowed, or 0 when it may run now. */
export function cooldownRemaining(lastRunAt: string | undefined, cooldownMinutes: number, now = Date.now()): number {
  const last = lastRunAt ? Date.parse(lastRunAt) : NaN;
  if (!Number.isFinite(last)) return 0;
  const left = last + cooldownMinutes * 60_000 - now;
  return left > 0 ? Math.ceil(left / 60_000) : 0;
}

/**
 * Shared by the manual buttons and the scheduled job. Only reads Naver; never posts answers.
 * Stub questions are allowed only for manual runs outside production.
 * A cooldown applies to manual runs; it is checked under the lock so concurrent clicks cannot both pass.
 */
export async function runKinDetection(opts: { allowStub: boolean; cooldownMinutes?: number }): Promise<KinDetectionResult> {
  const locked = await withKinDetectionLock(async (): Promise<KinDetectionResult> => {
    if (opts.cooldownMinutes) {
      const retryAfterMinutes = cooldownRemaining(await getLastKinDetection(), opts.cooldownMinutes);
      if (retryAfterMinutes) return { ok: false, reason: "cooldown", retryAfterMinutes };
    }
    await deleteExpiredKinRecords();
    const hasKeys = Boolean(process.env.NAVER_CLIENT_ID) && Boolean(process.env.NAVER_CLIENT_SECRET);
    let detected: KinQuestion[];
    let failures = 0; let attempts: number;
    if (hasKeys) {
      const detector = new NaverKinDetector();
      const keywords = (await listKeywordsFromStore()).filter(k => k.is_active).map(k => k.phrase);
      const result = await collectUnconfirmedQuestions(keywords, await listQuestions(), (keyword, start, size) =>
        detector.collect({
          keyword,
          engine: "naver",
          tab: "kin",
          device: "desktop",
          scanDepth: size,
          start,
          retainRaw: "none",
        }));
      detected = result.questions;
      failures = result.failures;
      attempts = result.attempts;
    } else {
      if (!opts.allowStub || process.env.NODE_ENV === "production") return { ok: false, reason: "not_configured" };
      attempts = 1;
      detected = stubQuestions();
    }
    const outcome = detectionOutcome(failures, attempts);
    if (!outcome.ok) return { ok: false, reason: "failed" };
    const added = await upsertQuestions(detected);
    const lastRunAt = new Date().toISOString();
    await recordKinDetection(lastRunAt);
    return { ok: true, mode: hasKeys ? "live" : "stub", partial: outcome.partial, failures, detected: detected.length, added, lastRunAt };
  });
  return locked.acquired && locked.value ? locked.value : { ok: false, reason: "busy" };
}
