import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeComparison } from "../src/collectors/trend-comparison";

test("normalizes groups from two requests using their shared anchor", () => {
  const a = [{ title: "혜전대학교", data: [{ period: "2026-01-01", ratio: 50 }] }, { title: "백석문화대학교", data: [{ period: "2026-01-01", ratio: 100 }] }];
  const b = [{ title: "혜전대학교", data: [{ period: "2026-01-01", ratio: 25 }] }, { title: "신성대학교", data: [{ period: "2026-01-01", ratio: 50 }] }];
  assert.deepEqual(normalizeComparison(a, b), { "혜전대학교": 50, "백석문화대학교": 100, "신성대학교": 100 });
});
test("does not fabricate a comparison when the shared anchor is zero or missing", () => {
  const a = [{ title: "혜전대학교", data: [{ period: "2026-01-01", ratio: 0 }] }, { title: "백석문화대학교", data: [{ period: "2026-01-01", ratio: 50 }] }];
  const b = [{ title: "혜전대학교", data: [{ period: "2026-01-01", ratio: 25 }] }, { title: "신성대학교", data: [{ period: "2026-01-01", ratio: 50 }] }];
  assert.equal(normalizeComparison(a, b), null);
});
test("does not combine mismatched periods", () => {
  const a = [{ title: "혜전대학교", data: [{ period: "2026-01-01", ratio: 50 }] }];
  const b = [{ title: "혜전대학교", data: [{ period: "2026-02-01", ratio: 50 }] }];
  assert.equal(normalizeComparison(a, b), null);
});
