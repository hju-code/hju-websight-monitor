import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

let server;
let tempDir;
let base;

before(async () => {
  const probe = createServer();
  await new Promise((resolve, reject) => probe.once("error", reject).listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  tempDir = await mkdtemp(join(tmpdir(), "websight-security-"));
  const env = { ...process.env, NODE_ENV: "development", WEBSIGHT_DEV_AUTH: "true", WEBSIGHT_STORE_PATH: join(tempDir, "store.json"), WEBSIGHT_DATABASE_URL: "", POSTGRES_URL: "" };
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", String(port)], { env, stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + "/login")).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("test server failed to start");
});

after(async () => {
  if (server) server.kill();
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

for (const path of ["/api/assignees", "/api/knowledge", "/api/kin/detect", "/api/kin/drafts?questionId=fixture"]) {
  test(`anonymous GET ${path} is denied`, async () => {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.ok([401, 403].includes(response.status), `expected denial, got ${response.status}`);
  });
}
for (const path of ["/admin/assignees", "/review"]) {
  test(`anonymous page ${path} is denied or redirects to login`, async () => {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.ok([401, 403, 307, 308].includes(response.status), `expected denial, got ${response.status}`);
  });
}
test("development login cannot grant a session", async () => {
  const response = await fetch(base + "/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "dev_session", email: "websight-admin@hj.ac.kr" }) });
  assert.ok([401, 403, 404].includes(response.status), `expected denial, got ${response.status}`);
});
test("anonymous collection is denied", async () => {
  const response = await fetch(base + "/api/runs?dry=1", { method: "POST" });
  assert.ok([401, 403].includes(response.status), `expected denial, got ${response.status}`);
});

for (const path of ["/api/assignees", "/api/keywords", "/api/knowledge", "/api/kin/detect", "/api/kin/drafts", "/api/settings"]) {
  test(`anonymous POST ${path} is denied`, async () => {
    const response = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    assert.ok([401, 403].includes(response.status), `expected denial, got ${response.status}`);
  });
}
test("unimplemented magic link cannot claim email was sent", async () => {
  const response = await fetch(base + "/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "websight-admin@hj.ac.kr" }) });
  assert.notEqual(response.status, 200);
});
