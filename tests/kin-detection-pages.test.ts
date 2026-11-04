import { test } from "node:test";
import assert from "node:assert/strict";
import { collectUnconfirmedQuestions } from "../src/collectors/kin-detection-pages";
import { NaverKinDetector, hitsToKinQuestions } from "../src/collectors/naver-kin";

test("skips confirmed answers and searches additional pages until 30 distinct questions are found", async () => {
  const hits = Array.from({ length: 60 }, (_, i) => ({ rank: i + 1, title: `혜전대 질문 ${i + 1}`, url: `https://kin.naver.com/qna/detail.naver?docId=${i + 1}` }));
  const confirmed = hitsToKinQuestions(hits.slice(0, 30)).map((q, i) => ({ ...q, status: i === 0 ? "dismissed" as const : "manual_posted" as const }));
  const starts: number[] = [];
  const result = await collectUnconfirmedQuestions(["혜전대"], confirmed, async (_keyword, start, size) => {
    starts.push(start);
    const page = hits.slice(start - 1, start - 1 + size);
    return { ok: true, hits: page, scanned: page.length, status: "ok", meta: { requestCount: 1, provider: "test", fetchedAt: "" } };
  }, { pageSize: 30, maxStart: 1000 });
  assert.deepEqual(starts, [1, 31]);
  assert.equal(result.questions.length, 30);
  assert.equal(result.questions[0].title, "혜전대 질문 31");
});

test("detector passes pagination start to Naver", async () => {
  const oldFetch = globalThis.fetch;
  const oldId = process.env.NAVER_CLIENT_ID, oldSecret = process.env.NAVER_CLIENT_SECRET;
  process.env.NAVER_CLIENT_ID = "test"; process.env.NAVER_CLIENT_SECRET = "test";
  let start = "";
  globalThis.fetch = async input => { start = new URL(String(input)).searchParams.get("start") ?? ""; return Response.json({ items: [] }); };
  try {
    await new NaverKinDetector().collect({ keyword: "혜전대", engine: "naver", tab: "kin", scanDepth: 30, start: 31 });
    assert.equal(start, "31");
  } finally { globalThis.fetch = oldFetch; if (oldId === undefined) delete process.env.NAVER_CLIENT_ID; else process.env.NAVER_CLIENT_ID = oldId; if (oldSecret === undefined) delete process.env.NAVER_CLIENT_SECRET; else process.env.NAVER_CLIENT_SECRET = oldSecret; }
});

test("examines each keyword and keeps saved but unconfirmed drafts eligible", async () => {
  const existing = hitsToKinQuestions([{ rank: 1, title: "혜전대 기존 질문", url: "https://kin.naver.com/qna/detail.naver?docId=existing" }]);
  existing[0].status = "drafted";
  const called: string[] = [];
  const result = await collectUnconfirmedQuestions(["첫째", "둘째"], existing, async keyword => {
    called.push(keyword);
    const hits = keyword === "첫째" ? [{ rank: 1, title: "혜전대 기존 질문", url: existing[0].naverUrl }] : [{ rank: 1, title: "혜전대 다른 질문", url: "https://kin.naver.com/qna/detail.naver?docId=other" }];
    return { ok: true, hits, scanned: hits.length, status: "ok", meta: { requestCount: 1, provider: "test", fetchedAt: "" } };
  });
  assert.deepEqual(called, ["첫째", "둘째"]);
  assert.equal(result.questions.length, 2);
  assert.ok(result.questions.some(q => q.id === existing[0].id));
});
