import { isSafeMutation } from "../../../auth/csrf";
import { requireRole } from "../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { addKeyword, listKeywordsFromStore } from "../../../db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const keywords = await listKeywordsFromStore();
  return NextResponse.json({ keywords });
}

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
    return NextResponse.json({ ok: true, keyword, source: "storage" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
