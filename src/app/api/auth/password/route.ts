import { isSafeMutation } from "../../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";
import { getAuthService, getCurrentUser, SESSION_COOKIE, sessionCookieOptions } from "../../../../auth/session";
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ ok: false }, { status: 415 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  const body = await req.json().catch(() => null) as { current?: unknown; next?: unknown } | null;
  if (!body || typeof body.current !== "string" || typeof body.next !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  const ok = await getAuthService().changePassword(user.id, body.current, body.next);
  if (!ok) return NextResponse.json({ ok: false, error: "현재 비밀번호와 새 비밀번호를 확인하세요. 새 비밀번호는 12자 이상이어야 합니다." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
