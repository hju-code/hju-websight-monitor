import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessQuestion } from "../src/auth/scope";
const user = { id: "u1", email: "user@example.org", role: "assignee" as const };
const assignment = { id: "a", assigneeEmail: "USER@example.org", keywordPhrase: "혜전대학교", siteKey: "naver-kin", isActive: true };
const question = { id: "q", naverUrl: "https://kin.naver.com/", title: "q", questionText: "", detectedAt: "2026-01-01", status: "new" as const, matchedAliases: [], matchedKeywords: ["혜전대학교"] };
test("only active matching assignments grant access", () => {
  assert.equal(canAccessQuestion(user, question, [assignment]), true);
  assert.equal(canAccessQuestion(user, question, [{ ...assignment, isActive: false }]), false);
  assert.equal(canAccessQuestion(user, question, [{ ...assignment, keywordPhrase: "다른 대학" }]), false);
  assert.equal(canAccessQuestion(user, question, [{ ...assignment, siteKey: "naver-web" }]), false);
  assert.equal(canAccessQuestion({ ...user, role: "admin" }, question, []), true);
});
