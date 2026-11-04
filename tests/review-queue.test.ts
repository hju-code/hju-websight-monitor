import { test } from "node:test";
import assert from "node:assert/strict";
import { needsAnswerReview } from "../src/kin/review-queue";

test("only manually confirmed replies leave the review queue", () => {
  assert.equal(needsAnswerReview("new"), true);
  assert.equal(needsAnswerReview("drafted"), true);
  assert.equal(needsAnswerReview("approved"), true);
  assert.equal(needsAnswerReview("manual_posted"), false);
});
