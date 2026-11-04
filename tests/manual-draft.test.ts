import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("a manual answer can be created and edited", async () => {
  const dir = await mkdtemp(join(tmpdir(), "websight-draft-"));
  process.env.WEBSIGHT_STORE_PATH = join(dir, "data.json");
  process.env.WEBSIGHT_DATABASE_URL = ""; process.env.POSTGRES_URL = "";
  try {
    const { upsertQuestions, saveDraftBody, getDraftForQuestion, getQuestion, setManualAnswerStatus } = await import("../src/db/store");
    await upsertQuestions([{ id: "manual-question", title: "질문", questionText: "", naverUrl: "https://kin.naver.com/test", detectedAt: new Date().toISOString(), matchedAliases: [], status: "new" }]);
    const first = await saveDraftBody("manual-question", "첫 답변");
    assert.equal(first?.draftBody, "첫 답변");
    await saveDraftBody("manual-question", "수정한 답변");
    assert.equal((await getDraftForQuestion("manual-question"))?.draftBody, "수정한 답변");
    assert.equal(await setManualAnswerStatus("manual-question", true), true);
    assert.equal((await getQuestion("manual-question"))?.status, "manual_posted");
    assert.equal(await setManualAnswerStatus("manual-question", false), true);
    assert.equal((await getQuestion("manual-question"))?.status, "drafted");
    assert.equal(await setManualAnswerStatus("missing", true), false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
