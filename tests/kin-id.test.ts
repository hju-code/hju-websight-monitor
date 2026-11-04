import { test } from "node:test";
import assert from "node:assert/strict";
import { hitsToKinQuestions } from "../src/collectors/naver-kin";
test("different questions at the same rank have distinct ids", () => {
  const a = hitsToKinQuestions([{ rank: 1, url: "https://kin.naver.com/qna/detail?docId=111", title: "혜전대 입시" }]);
  const b = hitsToKinQuestions([{ rank: 1, url: "https://kin.naver.com/qna/detail?docId=222", title: "혜전대 입시" }]);
  assert.notEqual(a[0].id, b[0].id);
});
