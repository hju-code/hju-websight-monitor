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

test("expired questions disappear from reads before the daily cleanup deletes them", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "websight-live-"));
  process.env.WEBSIGHT_STORE_PATH = join(dir, "data.json");
  process.env.WEBSIGHT_DATABASE_URL = ""; process.env.POSTGRES_URL = "";
  try {
    const { upsertQuestions, listQuestions, getQuestion } = await import("../src/db/store");
    await upsertQuestions([
      { id: "stale", title: "오래된 질문", questionText: "", naverUrl: "https://kin.naver.com/stale", detectedAt: "2020-01-01T00:00:00Z", matchedAliases: [], status: "new" },
      { id: "fresh", title: "새 질문", questionText: "", naverUrl: "https://kin.naver.com/fresh", detectedAt: new Date().toISOString(), matchedAliases: [], status: "new" },
    ]);
    const ids = (await listQuestions()).map(q => q.id);
    assert.ok(ids.includes("fresh")); assert.ok(!ids.includes("stale"));
    assert.equal(await getQuestion("stale"), null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
