import { NextRequest, NextResponse } from "next/server";
import { listKeywords } from "../../../db/repository";
import { addKeyword, listKeywordsFromStore } from "../../../db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listKeywords();
    return NextResponse.json({ source: "db", keywords: rows });
  } catch {
    const keywords = await listKeywordsFromStore();
    return NextResponse.json({
      source: "file",
      keywords,
      note: "WEBSIGHT_DATABASE_URL 미연결 — 파일 스토어",
    });
  }
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let phrase = "";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as { phrase?: string };
    phrase = body.phrase ?? "";
  } else {
    const fd = await req.formData();
    phrase = String(fd.get("phrase") ?? "");
  }
  try {
    const keyword = await addKeyword(phrase);
    return NextResponse.json({ ok: true, keyword, source: "file" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
