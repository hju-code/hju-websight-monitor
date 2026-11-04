import { test } from "node:test";
import assert from "node:assert/strict";
import { collectUniversityComparison } from "../src/collectors/university-comparison";

test("compares six schools with separate search counts and normalized trend values", async () => {
  const calls: string[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input); calls.push(url);
    if (init?.method === "POST") {
      const payload = JSON.parse(String(init.body));
      const results = payload.keywordGroups.map((g: {groupName:string}, i:number) => ({ title:g.groupName, data:[{period:"2026-09-01", ratio:i === 0 ? 50 : 100}] }));
      return Response.json({ results });
    }
    return Response.json({ total: 123 });
  };
  const out = await collectUniversityComparison({ clientId: "test", clientSecret: "test", now: new Date("2026-10-20T00:00:00Z"), fetcher });
  assert.equal(out.rows.length, 6);
  assert.ok(out.rows.every(r => r.searchResults === 123));
  assert.equal(out.rows[0].trend, 50);
  assert.ok(out.rows.slice(1).every(r => r.trend === 100));
  assert.equal(calls.length, 8);
  assert.equal(out.periodStart, "2026-09-01");
  assert.equal(out.periodEnd, "2026-09-30");
});
test("reports provider failures as unavailable rather than zero", async () => {
  const out = await collectUniversityComparison({ clientId: "x", clientSecret: "y", now: new Date("2026-10-20T00:00:00Z"), fetcher: async () => new Response("", { status: 503 }) });
  assert.ok(out.rows.every(r => r.searchResults === null && r.trend === null));
});
