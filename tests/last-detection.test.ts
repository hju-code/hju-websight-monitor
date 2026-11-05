import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("last detection falls back to question detection times and prefers the newest", async () => {
  const dir = await mkdtemp(join(tmpdir(), "websight-last-"));
  process.env.WEBSIGHT_STORE_PATH = join(dir, "data.json");
  process.env.WEBSIGHT_DATABASE_URL = ""; process.env.POSTGRES_URL = "";
  try {
    const { upsertQuestions, getLastKinDetection, recordKinDetection } = await import("../src/db/store");
    const detectedAt = new Date(Date.now() + 60_000).toISOString();
    await upsertQuestions([{ id: "earlier-run", title: "질문", questionText: "", naverUrl: "https://kin.naver.com/earlier", detectedAt, matchedAliases: [], status: "new" }]);
    assert.equal(await getLastKinDetection(), detectedAt);
    const recorded = new Date(Date.now() + 120_000).toISOString();
    await recordKinDetection(recorded);
    assert.equal(await getLastKinDetection(), recorded);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
