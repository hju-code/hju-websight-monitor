import { isSafeMutation } from "../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";
import { getAuthService, requireRole } from "../../../auth/session";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ users: await getAuthService().listUsers() });
}
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "unsupported" }, { status: 415 });
  const body = await req.json().catch(() => null) as { action?: unknown; email?: unknown; password?: unknown; name?: unknown; id?: unknown; active?: unknown } | null;
  if (!body) return NextResponse.json({ error: "invalid request" }, { status: 400 });
  try {
    const service = getAuthService();
    if (body.action === "create" && typeof body.email === "string" && typeof body.password === "string" && (body.name === undefined || typeof body.name === "string")) {
      const user = await service.createUser(body.email, body.password, body.name as string | undefined);
      return NextResponse.json({ ok: true, user });
    }
    if (body.action === "active" && typeof body.id === "string" && typeof body.active === "boolean") {
      await service.setActive(body.id, body.active); return NextResponse.json({ ok: true });
    }
    if (body.action === "reset" && typeof body.id === "string" && typeof body.password === "string") {
      await service.resetPassword(body.id, body.password); return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  } catch { return NextResponse.json({ error: "입력값이나 계정 상태를 확인하세요. 비밀번호는 12자 이상이어야 합니다." }, { status: 400 }); }
}
