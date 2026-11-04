import { test } from "node:test";
import assert from "node:assert/strict";
import { isSafeMutation } from "../src/auth/csrf";
test("same-origin requests pass and cross-site requests fail", () => {
  assert.equal(isSafeMutation(new Request("https://example.org/api", { method: "POST", headers: { origin: "https://example.org" } })), true);
  assert.equal(isSafeMutation(new Request("https://example.org/api", { method: "POST", headers: { origin: "https://attacker.org" } })), false);
  assert.equal(isSafeMutation(new Request("https://example.org/api", { method: "POST", headers: { "sec-fetch-site": "cross-site" } })), false);
});
