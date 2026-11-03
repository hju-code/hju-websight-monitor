import type { AssignmentScope, WebSightUser } from "./types";

export const FIXTURE_ADMIN: WebSightUser = {
  id: "user-admin-1",
  email: "websight-admin@hj.ac.kr",
  displayName: "WebSight 관리자",
  role: "admin",
};

export const FIXTURE_ASSIGNEE: WebSightUser = {
  id: "user-asg-1",
  email: "advisor@example.com",
  displayName: "입시 담당(예시)",
  role: "assignee",
};

export const FIXTURE_ASSIGNMENTS: AssignmentScope[] = [
  {
    id: "asg-1",
    keywordPhrase: "혜전대",
    siteKey: "naver-kin",
    assigneeEmail: "advisor@example.com",
    assigneeName: "입시 담당(예시)",
    isActive: true,
  },
  {
    id: "asg-2",
    keywordPhrase: "혜전대학교",
    siteKey: "naver-kin",
    assigneeEmail: "dept@example.com",
    assigneeName: "학과 담당(예시)",
    isActive: true,
  },
];
