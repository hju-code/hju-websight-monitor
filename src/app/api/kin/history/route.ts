import { NextRequest, NextResponse } from "next/server";
import { isSafeMutation } from "../../../../auth/csrf";
import { requireRole } from "../../../../auth/session";
import { changeHistoryState } from "../../../../db/store";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const user = await requireRole(["admin", "assignee"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "unsupported" }, { status: 415 });
  const body = await req.json().catch(() => null) as { ids?: unknown; action?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || !body.ids.length || body.ids.length > 100 || !body.ids.every(id => typeof id === "string" && id.length > 0 && id.length <= 100) || !["delete", "restore"].includes(String(body.action))) return NextResponse.json({ error: "요청을 확인해 주세요." }, { status: 400 });
  try {
    const ok = await changeHistoryState(body.ids, { role: user.role === "admin" ? "admin" : "assignee", email: user.email }, body.action === "delete");
    return NextResponse.json(ok ? { ok: true } : { error: "기록을 찾을 수 없거나 권한이 없습니다." }, { status: ok ? 200 : 404 });
  } catch { return NextResponse.json({ error: "기록을 처리하지 못했습니다." }, { status: 500 }); }
}
