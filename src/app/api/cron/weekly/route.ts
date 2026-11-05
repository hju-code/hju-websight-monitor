import { NextRequest, NextResponse } from "next/server";
import { authorizedCron } from "../../../../auth/cron";
import { runCollectJob } from "../../../../jobs/collect-run";
import { withCollectionLock } from "../../../../jobs/exclusive";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
/** Weekly search rank collection. */
export async function GET(req: NextRequest) {
  if (!authorizedCron(process.env.CRON_SECRET, req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await withCollectionLock(async () => {
      const collected = await runCollectJob({ persist: true, triggeredBy: "schedule" });
      return { failures: collected.failures };
    });
    if (!result.acquired) return NextResponse.json({ ok: true, skipped: true });
    return NextResponse.json({ ok: result.value?.failures === 0, ...result.value });
  } catch { return NextResponse.json({ ok: false, error: "scheduled job failed" }, { status: 500 }); }
}
