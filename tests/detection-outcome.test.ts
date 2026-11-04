import { test } from "node:test";
import assert from "node:assert/strict";
import { detectionOutcome } from "../src/collectors/detection-outcome";
test("a provider failure is distinct from a successful empty result", () => {
  assert.deepEqual(detectionOutcome(0, 2), { ok: true, partial: false });
  assert.deepEqual(detectionOutcome(1, 2), { ok: true, partial: true });
  assert.deepEqual(detectionOutcome(2, 2), { ok: false, partial: false });
  assert.deepEqual(detectionOutcome(0, 0), { ok: false, partial: false });
});
