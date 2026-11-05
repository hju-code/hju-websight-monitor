import { test } from "node:test";
import assert from "node:assert/strict";
import { cooldownRemaining } from "../src/jobs/kin-detect";

test("manual detection waits until the cooldown since the last detection has passed", () => {
  const now = Date.parse("2026-11-05T00:10:00Z");
  assert.equal(cooldownRemaining(undefined, 5, now), 0);
  assert.equal(cooldownRemaining("bad", 5, now), 0);
  assert.equal(cooldownRemaining("2026-11-05T00:09:30Z", 5, now), 5);
  assert.equal(cooldownRemaining("2026-11-05T00:06:00Z", 5, now), 1);
  assert.equal(cooldownRemaining("2026-11-05T00:05:00Z", 5, now), 0);
});
