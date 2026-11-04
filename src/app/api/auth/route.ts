import { isSafeMutation } from "../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";
import { getAuthService, getCurrentUser, initializeAdminIfNeeded, SESSION_COOKIE, sessionCookieOptions } from "../../../auth/session";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ ok: false }, { status: 415 });
  const body = await req.json().catch(() => null) as { email?: unknown; password?: unknown; mode?: unknown } | null;
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") return NextResponse.json({ ok: false, error: "이메일과 비밀번호를 확인하세요." }, { status: 403 });
  try {
    await initializeAdminIfNeeded();
    const login = await getAuthService().login(body.email, body.password);
    if (!login) return NextResponse.json({ ok: false, error: "이메일 또는 비밀번호를 확인하세요." }, { status: 401 });
    const response = NextResponse.json({ ok: true, user: login.user, redirect: login.user.mustChangePassword ? "/password" : login.user.role === "admin" ? "/admin" : "/review" });
    response.cookies.set(SESSION_COOKIE, login.token, sessionCookieOptions());
    return response;
  } catch { return NextResponse.json({ ok: false, error: "로그인 서비스를 사용할 수 없습니다." }, { status: 503 }); }
}
export async function GET() { return NextResponse.json({ authenticated: Boolean(await getCurrentUser()), user: await getCurrentUser() }); }
export async function DELETE(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await getAuthService().logout(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
