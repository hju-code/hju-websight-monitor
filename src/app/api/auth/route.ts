import { isSafeMutation } from "../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";
import { getAuthService, getCurrentSession, initializeAdminIfNeeded, SESSION_COOKIE, sessionCookieOptions } from "../../../auth/session";

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
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
    const reason = error instanceof Error && error.message === "Invalid initial administrator credentials" ? "invalid_initial_credentials" : error instanceof Error && error.message === "Initial administrator credentials are not configured" ? "missing_initial_credentials" : "authentication_service_error";
    console.error("Login service failure", { reason, code });
    return NextResponse.json({ ok: false, error: "로그인 서비스를 사용할 수 없습니다." }, { status: 503 });
  }
}
export async function GET() { const session = await getCurrentSession(); return NextResponse.json({ authenticated: !!session, user: session?.user ?? null, expiresAt: session?.expiresAt ?? null }); }
export async function PATCH(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const expiresAt = token ? await getAuthService().renewSession(token) : null;
  if (!expiresAt || !token) return NextResponse.json({ error: "로그인 시간이 만료되었습니다. 다시 로그인해 주세요." }, { status: 401 });
  const response = NextResponse.json({ ok: true, expiresAt });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
export async function DELETE(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await getAuthService().logout(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
