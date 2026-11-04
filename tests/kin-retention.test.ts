import { test } from "node:test";
import assert from "node:assert/strict";
import { purgeExpiredKinRecords } from "../src/kin/retention";

test("removes expired questions, their linked records, and old orphan records without extending their deadline", () => {
  const now = Date.parse("2026-11-04T00:00:00Z");
  const at = (days: number) => new Date(now - days * 86400000).toISOString();
  const questions = [
    { id: "old", detectedAt: at(20) },
    { id: "young", detectedAt: at(19) },
    { id: "bad", detectedAt: "bad" },
  ];
  const drafts = [
    { id: "old-question-recent-answer", questionId: "old", createdAt: at(1) },
    { id: "young", questionId: "young", createdAt: at(1) },
    { id: "old-orphan", questionId: "missing", createdAt: at(20) },
    { id: "bad-question", questionId: "bad", createdAt: at(1) },
  ];
  const result = purgeExpiredKinRecords(questions, drafts, now);
  assert.deepEqual(result.questions.map(q => q.id), ["young"]);
  assert.deepEqual(result.drafts.map(d => d.id), ["young"]);
});
