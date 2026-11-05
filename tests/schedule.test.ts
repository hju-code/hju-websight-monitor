import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DAILY_CRON, WEEKLY_CRON } from "../src/config/schedule";

test("vercel.json cron entries match the schedules shown on screen", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as { crons: { path: string; schedule: string }[] };
  assert.deepEqual(config.crons, [DAILY_CRON, WEEKLY_CRON].map(({ path, schedule }) => ({ path, schedule })));
});
