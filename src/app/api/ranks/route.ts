import { NextRequest, NextResponse } from "next/server";
import { listRecentRanks } from "../../../db/repository";
import { getPublicStats } from "../../../db/live-stats";
import { listRanksFromStore, statsSummary } from "../../../db/store";
import { loadAppEnv } from "../../../config/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const live =
    req.nextUrl.searchParams.get("live") === "1" ||
    req.nextUrl.searchParams.get("live") === "true";
  const force =
    req.nextUrl.searchParams.get("force") === "1" ||
    req.nextUrl.searchParams.get("force") === "true";
  const keyword = req.nextUrl.searchParams.get("q")?.trim();

  if (live) {
    const stats = await getPublicStats({
      forceLive: force,
      keywords: keyword ? [keyword] : ["혜전대학교"],
    });
    return NextResponse.json({
      source: "live",
      mode: stats.mode,
      ranks: stats.rows.map((r) => ({
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
      summary: stats,
      note: stats.note,
    });
  }

  const env = loadAppEnv();
  if (env.databaseUrl) {
    try {
      const ranks = await listRecentRanks(100);
      return NextResponse.json({ source: "db", ranks });
    } catch {
      // fall through to file / live
    }
  }

  const ranks = await listRanksFromStore(100);
  const hasLive = ranks.some((r) => r.source === "live");
  if (!hasLive && process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
    const stats = await getPublicStats({
      forceLive: true,
      keywords: ["혜전대학교"],
    });
    return NextResponse.json({
      source: "live",
      mode: stats.mode,
      ranks: stats.rows.map((r) => ({
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
      summary: stats,
      note: stats.note ?? "auto live — stored ranks were sample-only",
    });
  }

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
