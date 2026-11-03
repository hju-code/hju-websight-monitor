/** P1 seed keywords + default enabled channels. */

export const SEED_KEYWORDS = [
  { phrase: "혜전대학교", is_brand: true, match_mode: "domain_or_name" as const },
  { phrase: "혜전대", is_brand: true, match_mode: "domain_or_name" as const },
] as const;

export const SEED_CHANNELS = [
  { engine: "naver", tab: "web", device: "desktop", is_enabled: true },
  { engine: "daum", tab: "web", device: "desktop", is_enabled: true },
  { engine: "google", tab: "web", device: "desktop", is_enabled: false }, // deferred A2
] as const;
