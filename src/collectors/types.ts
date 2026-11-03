/** Collector contract (P0 draft + P1 web collectors). */

export type Engine = "naver" | "google" | "daum";
export type Tab = "web" | "news" | "blog" | "cafe" | "kin";
export type Device = "desktop";

export type RetainRaw = "none" | "ephemeral" | "history_ttl";

export interface CollectRequest {
  keyword: string;
  engine: Engine;
  tab: Tab;
  device?: Device;
  scanDepth: number; // approved default 100
  retainRaw?: RetainRaw;
}

/**
 * Ephemeral hit used only for in-memory matching.
 * title/snippet MUST NOT be persisted under TOS_MODE=derived_meta.
 */
export interface OrganicHit {
  rank: number;
  url: string;
  title: string;
  snippet?: string;
  publishedAt?: string;
}

export type CollectStatus =
  | "ok"
  | "partial"
  | "quota"
  | "tos_blocked"
  | "unsupported"
  | "error";

export interface CollectMeta {
  requestCount: number;
  provider: string;
  fetchedAt: string; // ISO
  notes?: string[];
}

export interface CollectResult {
  ok: boolean;
  hits: OrganicHit[];
  scanned: number;
  status: CollectStatus;
  errorMessage?: string;
  meta: CollectMeta;
}

export interface Collector {
  readonly id: string;
  supports(engine: Engine, tab: Tab): boolean;
  collect(req: CollectRequest): Promise<CollectResult>;
}
