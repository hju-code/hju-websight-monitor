import { NextRequest, NextResponse } from "next/server";
import {
  consumeMagicToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../../../../auth/session";

export const dynamic = "force-dynamic";

/** Consume magic-link token and set session cookie, then redirect. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }
  const result = await consumeMagicToken(token);
  if (!result.ok || !result.session) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(result.error ?? "invalid")}`, req.url),
    );
  }
  const dest = result.session.role === "admin" ? "/admin" : "/review";
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set(SESSION_COOKIE, result.session.token, sessionCookieOptions());
  return res;
}
