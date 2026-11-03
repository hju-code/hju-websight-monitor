import { NextResponse } from "next/server";
import { listRecentRanks } from "../../../db/repository";
import { listRanksFromStore, statsSummary } from "../../../db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ranks = await listRecentRanks(100);
    return NextResponse.json({ source: "db", ranks });
  } catch {
    const ranks = await listRanksFromStore(100);
    const summary = await statsSummary();
    return NextResponse.json({
      source: "file",
      ranks: ranks.map((r) => ({
        id: r.id,
        collected_at: r.collectedAt,
        school_rank: r.schoolRank,
        school_status: r.schoolStatus,
        matched_domain: r.matchedDomain,
        matched_url: r.matchedUrl,
        phrase: r.phrase,
        engine: r.engine,
        tab: r.tab,
        source_tag: r.source,
      })),
      summary,
      note: "PG 미연결 — 파일 스토어(샘플/드라이런) 집계",
    });
  }
}
