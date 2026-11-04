import { test } from "node:test";
import assert from "node:assert/strict";
import { validSnapshotTtl } from "../src/config/tos";
test("retention is a whole number between 1 and 21 days", () => {
  for (const n of [0, -1, 22, 1.5, NaN]) assert.equal(validSnapshotTtl(n), false);
  for (const n of [1, 21]) assert.equal(validSnapshotTtl(n), true);
});
