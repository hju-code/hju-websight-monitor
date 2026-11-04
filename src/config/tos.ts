/**
 * ToS-safe storage policy (assumption A1).
 * - No raw SERP JSON / title / snippet in durable storage
 * - Derived ranking meta only
 * - Optional snapshot TTL ≤ 21 days
 */

export type TosMode = "derived_meta";

export interface TosPolicy {
  mode: TosMode;
  /** 0 = TTL off (not recommended before legal clearance) */
  snapshotTtlDays: number;
  /** Keep long-term daily rank numbers without URL/title — off until clearance */
  aggregateKeep: boolean;
  retainRawDefault: "none";
}

export function validSnapshotTtl(value: number): boolean { return Number.isInteger(value) && value >= 1 && value <= 21; }

export function loadTosPolicy(): TosPolicy {
  const ttlRaw = process.env.SNAPSHOT_TTL_DAYS;
  const ttl = ttlRaw === undefined || ttlRaw === "" ? 21 : Number(ttlRaw);

  return {
    mode: (process.env.TOS_MODE as TosMode) || "derived_meta",
    snapshotTtlDays: validSnapshotTtl(ttl) ? ttl : 21,
    aggregateKeep: process.env.AGGREGATE_KEEP === "true",
    retainRawDefault: "none",
  };
}

export function computeExpiresAt(
  collectedAt: Date,
  ttlDays: number,
): Date | null {
  if (!ttlDays || ttlDays <= 0) return null;
  const expires = new Date(collectedAt.getTime());
  expires.setUTCDate(expires.getUTCDate() + ttlDays);
  return expires;
}
