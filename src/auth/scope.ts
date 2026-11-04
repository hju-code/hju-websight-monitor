import type { AssignmentScope, WebSightUser } from "./types";
import type { KinQuestion } from "../kin/types";
export function canAccessQuestion(user: WebSightUser, question: KinQuestion, assignments: AssignmentScope[]): boolean {
  if (user.role === "admin") return true;
  const keywords = new Set(question.matchedKeywords ?? []);
  return assignments.some(a => a.isActive && a.siteKey === "naver-kin" && a.assigneeEmail.trim().toLowerCase() === user.email.toLowerCase() && keywords.has(a.keywordPhrase));
}
