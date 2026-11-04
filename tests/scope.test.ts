import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessQuestion } from "../src/auth/scope";
const user = { id: "u1", email: "user@example.org", role: "assignee" as const };
const assignment = { id: "a", assigneeEmail: "USER@example.org", keywordPhrase: "혜전대학교", siteKey: "naver-kin", isActive: true };
const question = { id: "q", naverUrl: "https://kin.naver.com/", title: "q", questionText: "", detectedAt: "2026-01-01", status: "new" as const, matchedAliases: [], matchedKeywords: ["혜전대학교"] };
test("registered users and administrators can review questions", () => {
  assert.equal(canAccessQuestion(user, question, [assignment]), true);
  assert.equal(canAccessQuestion(user, question, []), true);
  assert.equal(canAccessQuestion({ ...user, role: "admin" }, question, []), true);
});
