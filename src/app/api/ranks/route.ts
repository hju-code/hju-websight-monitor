import { NextResponse } from "next/server";
import { getPublicStats } from "../../../db/live-stats";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json({ source: "stored", mode: stats.mode, ranks: stats.rows, summary: stats });
  } catch { return NextResponse.json({ error: "통계를 불러올 수 없습니다." }, { status: 503 }); }
}
