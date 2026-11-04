import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveDatabaseUrl } from "../src/config/env";
test("preview cannot use a production database URL by default", () => {
  const prior = { ...process.env };
  try {
    process.env.VERCEL = "1"; process.env.VERCEL_ENV = "preview";
    process.env.POSTGRES_URL = "postgresql://example/production";
    delete process.env.WEBSIGHT_PREVIEW_DATABASE_URL;
    assert.equal(resolveDatabaseUrl(), undefined);
    process.env.WEBSIGHT_PREVIEW_DATABASE_URL = "postgresql://example/preview";
    assert.equal(resolveDatabaseUrl(), "postgresql://example/preview");
  } finally { process.env = prior; }
});
