import { NextRequest, NextResponse } from "next/server";
import {
  createDevSession,
  createMagicLink,
  getCurrentUser,
  isDevAuthEnabled,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../../../auth/session";
import { AUTH_STRATEGY_RECOMMENDATION } from "../../../auth/types";

export const dynamic = "force-dynamic";

async function readEmail(req: NextRequest): Promise<{
  email: string;
  mode?: string;
}> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as { email?: string; mode?: string };
    return { email: body.email ?? "", mode: body.mode };
  }
  const fd = await req.formData();
  return {
    email: String(fd.get("email") ?? ""),
    mode: String(fd.get("mode") ?? "") || undefined,
  };
}

/** Request magic link or create dev email session. */
export async function POST(req: NextRequest) {
  const { email, mode } = await readEmail(req);
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "valid email required" },
      { status: 400 },
    );
  }

  if (mode === "dev_session" || mode === "dev") {
    const result = await createDevSession(email);
    if (!result.ok || !result.cookieValue) {
      return NextResponse.json(
        { ok: false, error: result.error, strategy: AUTH_STRATEGY_RECOMMENDATION },
        { status: 403 },
      );
    }
    const res = NextResponse.json({
      ok: true,
      strategy: AUTH_STRATEGY_RECOMMENDATION,
      mode: "dev_session",
      user: result.user,
      redirect:
        result.user?.role === "admin" ? "/admin" : "/review",
      autoPostEnabled: false,
    });
    res.cookies.set(
      SESSION_COOKIE,
      result.cookieValue,
      sessionCookieOptions(),
    );
    return res;
  }

  const link = await createMagicLink(email);
  if (!link.ok) {
    return NextResponse.json(
      { ok: false, error: link.error, strategy: AUTH_STRATEGY_RECOMMENDATION },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    strategy: AUTH_STRATEGY_RECOMMENDATION,
    email: email.trim().toLowerCase(),
    expiresAt: link.expiresAt,
    magicUrl: link.magicUrl,
    devAuth: isDevAuthEnabled(),
    note: link.magicUrl
      ? "개발 모드: 아래 링크로 로그인 (SMTP 미설정)"
      : "매직링크 메일을 발송했습니다 (SMTP).",
    autoPostEnabled: false,
  });
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    strategy: AUTH_STRATEGY_RECOMMENDATION,
    authenticated: Boolean(user),
    user,
    devAuth: isDevAuthEnabled(),
    autoPostEnabled: false,
  });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, loggedOut: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}
