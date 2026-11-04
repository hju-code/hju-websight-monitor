import { NextRequest, NextResponse } from "next/server";
import { authorizedCron } from "../../../../auth/cron";
import { deleteExpiredSnapshots } from "../../../../db/repository";
import { runCollectJob } from "../../../../jobs/collect-run";
import { withCollectionLock } from "../../../../jobs/exclusive";
import { deleteExpiredKinRecords } from "../../../../db/store";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  if (!authorizedCron(process.env.CRON_SECRET, req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const expiredKin = await deleteExpiredKinRecords();
    const result = await withCollectionLock(async () => {
      const expired = await deleteExpiredSnapshots();
      const collected = await runCollectJob({ persist: true, triggeredBy: "schedule" });
      return { expired, failures: collected.failures };
    });
    if (!result.acquired) return NextResponse.json({ ok: true, skipped: true, expiredKin });
    return NextResponse.json({ ok: result.value?.failures === 0, ...result.value, expiredKin });
  } catch { return NextResponse.json({ ok: false, error: "scheduled job failed" }, { status: 500 }); }
}
