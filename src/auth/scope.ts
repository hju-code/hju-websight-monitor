import type { AssignmentScope, WebSightUser } from "./types";
import type { KinQuestion } from "../kin/types";
export function canAccessQuestion(user: WebSightUser, question: KinQuestion, assignments: AssignmentScope[]): boolean {
  void question; void assignments;
  return user.role === "admin" || user.role === "assignee";
}
