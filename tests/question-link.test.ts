import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNaverQuestionUrl } from "../src/kin/question-link";

test("only accepts official HTTPS Naver question links", () => {
  assert.equal(safeNaverQuestionUrl("https://kin.naver.com/qna/detail.naver?docId=123"), "https://kin.naver.com/qna/detail.naver?docId=123");
  assert.equal(safeNaverQuestionUrl("https://openapi.naver.com/l?test=abc"), "https://openapi.naver.com/l?test=abc");
  assert.equal(safeNaverQuestionUrl("javascript:alert(1)"), undefined);
  assert.equal(safeNaverQuestionUrl("https://kin.naver.com.attacker.example/x"), undefined);
  assert.equal(safeNaverQuestionUrl("http://kin.naver.com/qna/detail.naver"), undefined);
});
