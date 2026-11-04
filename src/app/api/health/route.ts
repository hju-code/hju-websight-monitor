import { NextResponse } from "next/server";
import { getPool } from "../../../db/pool";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await getPool().query("SELECT 1 FROM websight.accounts LIMIT 1");
    await getPool().query("SELECT 1 FROM websight.app_state LIMIT 1");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
