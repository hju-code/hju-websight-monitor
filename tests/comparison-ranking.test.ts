import { test } from "node:test";
import assert from "node:assert/strict";
import { rankBy, sortBy } from "../src/stats/comparison-ranking";

const rows = [
  { university: "A", searchResults: 100, trend: 50 },
  { university: "B", searchResults: 300, trend: null },
  { university: "C", searchResults: 300, trend: 80 },
  { university: "D", searchResults: null, trend: 10 },
];

test("ranks highest first, shares ranks on ties and skips missing values", () => {
  assert.deepEqual([...rankBy(rows, "searchResults")], [["A", 3], ["B", 1], ["C", 1]]);
  assert.deepEqual([...rankBy(rows, "trend")], [["A", 2], ["C", 1], ["D", 3]]);
});

test("sorts both directions and always keeps missing values last", () => {
  assert.deepEqual(sortBy(rows, "trend", "desc").map(r => r.university), ["C", "A", "D", "B"]);
  assert.deepEqual(sortBy(rows, "trend", "asc").map(r => r.university), ["D", "A", "C", "B"]);
  assert.deepEqual(sortBy(rows, "searchResults", "desc").map(r => r.university), ["B", "C", "A", "D"]);
});

test("default comparison view ranks by search results descending", () => {
  const ordered = sortBy(rows, "searchResults", "desc");
  const ranks = rankBy(rows, "searchResults");
  assert.deepEqual(ordered.map((r) => r.university), ["B", "C", "A", "D"]);
  assert.equal(ranks.get("B"), 1);
  assert.equal(ranks.get("C"), 1);
  assert.equal(ranks.get("A"), 3);
  assert.equal(ranks.get("D"), undefined);
});
