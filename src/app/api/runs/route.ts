import { NextRequest, NextResponse } from "next/server";
import { runCollectJob } from "../../../jobs/collect-run";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const expected = process.env.WEBSIGHT_ADMIN_TOKEN;
  const got = req.headers.get("x-admin-token");
  const devOk =
    process.env.WEBSIGHT_DEV_AUTH !== "false" && !expected;
  if (expected) {
    if (got !== expected) return unauthorized();
  } else if (!devOk) {
    return NextResponse.json(
      {
        error:
          "WEBSIGHT_ADMIN_TOKEN not set — refuse manual runs until admin token configured",
      },
      { status: 503 },
    );
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  try {
    const out = await runCollectJob({
      persist: !dry,
      triggeredBy: "manual",
    });
    return NextResponse.json({ ok: true, dry, ...out });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
