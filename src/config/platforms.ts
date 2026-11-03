/**
 * Admin platform checkboxes — aligned with websight-platform-expansion.md
 *
 * Active: naver_web, daum_web, youtube (may enable)
 * Conditional: instagram (hashtag-only), x (paid access)
 * Not recommended: tiktok, facebook — hard to access data for ops
 *
 * Checked → periodic collect target. Auto-post: never. School: 혜전대학교.
 */

export type PlatformKind = "search_web" | "social";

/** Admin UI / policy tier from platform expansion research */
export type PlatformTier = "active" | "conditional" | "not_recommended";

export interface PlatformOption {
  id: string;
  label: string;
  kind: PlatformKind;
  tier: PlatformTier;
  /** Default checked in settings UI */
  defaultEnabled: boolean;
  /** Short limitation / reason shown next to checkbox */
  restrictionLabel: string;
  notes?: string;
}

export const PLATFORM_CATALOG: PlatformOption[] = [
  {
    id: "naver_web",
    label: "네이버 웹",
    kind: "search_web",
    tier: "active",
    defaultEnabled: true,
    restrictionLabel: "활성",
    notes: "P1 SERP Collector",
  },
  {
    id: "daum_web",
    label: "다음 웹",
    kind: "search_web",
    tier: "active",
    defaultEnabled: true,
    restrictionLabel: "활성",
    notes: "P1 SERP Collector",
  },
  {
    id: "youtube",
    label: "YouTube",
    kind: "social",
    tier: "active",
    defaultEnabled: true,
    restrictionLabel: "활성 — Data API 확장 1순위",
    notes: "search.list + videos.list · 구현은 승인 후",
  },
  {
    id: "instagram",
    label: "Instagram",
    kind: "social",
    tier: "conditional",
    defaultEnabled: false,
    restrictionLabel: "조건부 — 해시태그 한정",
    notes: "키워드 검색량 API 없음 · Hashtag Search만",
  },
  {
    id: "x",
    label: "X (Twitter)",
    kind: "social",
    tier: "conditional",
    defaultEnabled: false,
    restrictionLabel: "조건부 — 유료 접근",
    notes: "counts/search 가능하나 신규 무료 읽기 사실상 없음",
  },
  {
    id: "tiktok",
    label: "TikTok",
    kind: "social",
    tier: "not_recommended",
    defaultEnabled: false,
    restrictionLabel: "비권장 — 운영 목적 데이터 접근 어려움",
    notes: "Research API 학술 성격 · 운영 배치 비적합",
  },
  {
    id: "facebook",
    label: "Facebook",
    kind: "social",
    tier: "not_recommended",
    defaultEnabled: false,
    restrictionLabel: "비권장 — 운영 목적 데이터 접근 어려움",
    notes: "공개 포스트 키워드 검색 없음",
  },
];

export const PLATFORM_EXPANSION_DOC =
  "/cursor/stores/self/docs/websight-platform-expansion.md";

export const PLATFORM_CATALOG_NOTE =
  "티어는 websight-platform-expansion.md 조사 결과 기준. 체크된 플랫폼만 혜전대학교 노출 조회/수집 대상. 자동 게시 없음.";

export type EnabledPlatformsSetting = {
  enabled: string[];
  updatedAt?: string;
};

export function defaultEnabledPlatforms(): EnabledPlatformsSetting {
  return {
    enabled: PLATFORM_CATALOG.filter((p) => p.defaultEnabled).map((p) => p.id),
    updatedAt: undefined,
  };
}

export const ENABLED_PLATFORMS_KEY = "enabled_platforms";

export function platformsByTier(tier: PlatformTier): PlatformOption[] {
  return PLATFORM_CATALOG.filter((p) => p.tier === tier);
}
