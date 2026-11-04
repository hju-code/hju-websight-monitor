export function detectionOutcome(failures: number, attempts: number): { ok: boolean; partial: boolean } {
  return { ok: attempts > 0 && failures < attempts, partial: failures > 0 && failures < attempts };
}
