import { test } from "node:test";
import assert from "node:assert/strict";
import { aiConfig, prepareKnowledge, draftFromKnowledge } from "../src/kin/ai";

test("missing API key fails clearly", () => {
  const oldKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try { assert.throws(() => aiConfig(), /OPENAI_API_KEY/); }
  finally { if (oldKey !== undefined) process.env.OPENAI_API_KEY = oldKey; }
});

test("school materials are indexed and retrieved for an independently supplied topic", async () => {
  const original = globalThis.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  globalThis.fetch = async (url, init) => {
    const path = String(url);
    const body = JSON.parse(String(init?.body));
    requests.push({ path, body });
    const result = path.endsWith("/embeddings") ? { data: [{ embedding: [1, 0] }] } : { output: [{ content: [{ type: "output_text", text: "학교 자료에 기반한 내용" }] }] };
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const indexed = await prepareKnowledge("입학 안내", "공식 입학 안내 자료", []);
    const result = await draftFromKnowledge("지원 자격", [{ title: "입학 안내", summary: indexed.summary, embedding: indexed.embedding }]);
    assert.equal(result.answer, "학교 자료에 기반한 내용");
    assert.deepEqual(result.sources, ["입학 안내"]);
    assert.equal(requests.length, 4);
    assert.ok(requests.filter(r => r.path.endsWith("/responses")).every(r => r.body.store === false));
    assert.ok(!JSON.stringify(requests).includes("kin.naver.com"));
  } finally { globalThis.fetch = original; if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey; }
});
