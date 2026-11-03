/**
 * Auth / role model for WebSight admin + assignees.
 * Auto-post to Naver remains forbidden regardless of role.
 */

export type WebSightRole = "admin" | "assignee";

export interface WebSightUser {
  id: string;
  email: string;
  displayName?: string;
  role: WebSightRole;
}

/** Keyword or site scope an assignee is responsible for. */
export interface AssignmentScope {
  id: string;
  /** SERP/Kin keyword phrase, e.g. 혜전대 */
  keywordPhrase: string;
  /** Optional site/channel label, e.g. naver-kin */
  siteKey: string;
  assigneeEmail: string;
  assigneeName?: string;
  isActive: boolean;
}

export type AuthStrategyId = "reuse_campus" | "magic_link";

/**
 * A — Reuse AI Help / HJU-IR campus account system
 * B — Independent email magic-link + session (WebSight-only)
 * Decision deferred to implementation; see docs recommendation.
 */
export interface AuthStrategyOption {
  id: AuthStrategyId;
  label: string;
  pros: string[];
  cons: string[];
}

export const AUTH_STRATEGY_OPTIONS: AuthStrategyOption[] = [
  {
    id: "reuse_campus",
    label: "A. AI 헬프 / HJU-IR 계정 재사용",
    pros: [
      "교내 계정 한 곳에서 관리",
      "비밀번호·SSO 정책 재사용 가능",
      "퇴사자 계정 회수와 연동 용이",
    ],
    cons: [
      "ai-helper/IR과 결합도↑ — 배포·장애 경계 흐려질 수 있음",
      "역할(답변 담당자) 매핑을 외부 IdP/DB에 추가해야 함",
      "WebSight만의 최소권한 분리가 어려울 수 있음",
    ],
  },
  {
    id: "magic_link",
    label: "B. 독립 이메일 매직링크·세션",
    pros: [
      "앱 경계 명확 (별도 폴더·별도 세션)",
      "담당자 이메일만으로 빠른 온보딩",
      "AI 헬프/IR 장애와 분리",
    ],
    cons: [
      "매직링크 메일 인프라·토큰 만료 구현 필요",
      "교내 계정 회수와 이중 관리",
      "장기적으로 SSO 요청 시 재작업 가능",
    ],
  },
];

/** Recommended default until campus IdP wiring is confirmed. */
export const AUTH_STRATEGY_RECOMMENDATION: AuthStrategyId = "magic_link";

export const AUTH_RECOMMENDATION_NOTE =
  "P1 권고: B(매직링크)로 담당자 검토를 먼저 열고, 교내 IdP/AI헬프 연동 비용이 낮아지면 A로 이전. 어느 쪽이든 네이버 자동 게시 없음.";
