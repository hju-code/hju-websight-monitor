import { NextResponse } from "next/server";
import { getPool } from "../../../db/pool";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await getPool().query("SELECT 1 FROM websight.accounts LIMIT 1");
    await getPool().query("SELECT 1 FROM websight.app_state LIMIT 1");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const e = error as { code?: string; name?: string };
    console.error("Database health check failed", { code: e.code, name: e.name });
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
