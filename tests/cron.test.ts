import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizedCron } from "../src/auth/cron";
test("cron token must be configured and match exactly", () => {
  assert.equal(authorizedCron(undefined, "Bearer secret"), false);
  assert.equal(authorizedCron("secret", undefined), false);
  assert.equal(authorizedCron("secret", "Bearer wrong"), false);
  assert.equal(authorizedCron("secret", "Bearer secret"), true);
});
