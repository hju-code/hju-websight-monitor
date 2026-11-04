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
  mustChangePassword?: boolean;
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
