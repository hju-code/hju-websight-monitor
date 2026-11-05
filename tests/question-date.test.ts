import { test } from "node:test";
import assert from "node:assert/strict";
import { validQuestionDate, isWithinQuestionDates } from "../src/kin/question-date";

test("validates calendar dates and rejects future or malformed dates", () => {
  assert.equal(validQuestionDate("2026-10-27", "2026-11-04"), true);
  assert.equal(validQuestionDate("2026-02-30", "2026-11-04"), false);
  assert.equal(validQuestionDate("2026-11-05", "2026-11-04"), false);
  assert.equal(validQuestionDate("26.10.27", "2026-11-04"), false);
});

test("date filtering never guesses the date of an undated question", () => {
  assert.equal(isWithinQuestionDates("2026-10-27", "2026-10-01", "2026-10-31"), true);
  assert.equal(isWithinQuestionDates(undefined, "2026-10-01", ""), false);
  assert.equal(isWithinQuestionDates(undefined, "", ""), true);
});
