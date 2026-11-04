import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, validatePassword } from "../src/auth/password";

test("password hashes are salted and verify only the original password", async () => {
  const a = await hashPassword("safe-password-for-test-42");
  const b = await hashPassword("safe-password-for-test-42");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("safe-password-for-test-42", a), true);
  assert.equal(await verifyPassword("wrong-password-for-test", a), false);
  assert.equal(await verifyPassword("anything", "malformed"), false);
});
test("rejects passwords below the minimum and oversized input", () => {
  assert.equal(validatePassword("short"), false);
  assert.equal(validatePassword("a".repeat(1025)), false);
  assert.equal(validatePassword("good-password-42"), true);
});
