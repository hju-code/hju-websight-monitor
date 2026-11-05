import { NextRequest, NextResponse } from "next/server";
import { authorizedCron } from "../../../../auth/cron";
import { deleteExpiredSnapshots } from "../../../../db/repository";
import { runKinDetection, type KinDetectionResult } from "../../../../jobs/kin-detect";
import { deleteExpiredKinRecords } from "../../../../db/store";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
/** Daily: retention cleanup first, then automatic Kin detection. Rank collection runs weekly. */
export async function GET(req: NextRequest) {
  if (!authorizedCron(process.env.CRON_SECRET, req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const expiredKin = await deleteExpiredKinRecords();
    const expired = await deleteExpiredSnapshots();
    let kin: KinDetectionResult;
    try { kin = await runKinDetection({ allowStub: false }); } catch { kin = { ok: false, reason: "failed" }; }
    const kinOk = kin.ok || kin.reason === "not_configured";
    return NextResponse.json({ ok: kinOk, expired, expiredKin, kin });
  } catch { return NextResponse.json({ ok: false, error: "scheduled job failed" }, { status: 500 }); }
}
