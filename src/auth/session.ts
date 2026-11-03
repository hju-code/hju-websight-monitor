/**
 * Session + magic-link auth (strategy B).
 * Dev mode: WEBSIGHT_DEV_AUTH=true (default when no SMTP) returns link in JSON
 * and allows instant email session for registered users.
 * Roles: admin vs assignee — never enables Naver auto-post.
 */
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  findUserByEmail,
  listAssignees,
  listUsers,
} from "../db/store";
import { readStore, updateStore, type SessionRecord } from "../db/file-store";
import type { WebSightRole, WebSightUser } from "./types";

export const SESSION_COOKIE = "websight_session";
const SESSION_DAYS = 7;
const MAGIC_MINUTES = 30;

function token() {
  return randomBytes(24).toString("hex");
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function isDevAuthEnabled(): boolean {
  if (process.env.WEBSIGHT_DEV_AUTH === "false") return false;
  if (process.env.WEBSIGHT_DEV_AUTH === "true") return true;
  // Default: enable when no SMTP configured (cloud / local)
  return !process.env.WEBSIGHT_SMTP_URL;
}

export async function createMagicLink(email: string): Promise<{
  ok: boolean;
  error?: string;
  magicUrl?: string;
  expiresAt?: string;
  role?: WebSightRole;
}> {
  const user = await findUserByEmail(email);
  if (!user) {
    // Also allow active assignee emails even if user row missing
    const assignees = await listAssignees();
    const hit = assignees.find(
      (a) => a.isActive && a.assigneeEmail.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!hit) {
      return { ok: false, error: "등록되지 않은 이메일입니다. 관리자에게 담당자 등록을 요청하세요." };
    }
  }

  const raw = token();
  const expiresAt = new Date(Date.now() + MAGIC_MINUTES * 60_000).toISOString();
  await updateStore((store) => {
    store.magicLinks = store.magicLinks.filter((m) => !m.used);
    store.magicLinks.push({
      token: hash(raw),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      expiresAt,
      used: false,
    });
  });

  const base =
    process.env.WEBSIGHT_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://127.0.0.1:3040";
  const magicUrl = `${base.replace(/\/$/, "")}/api/auth/verify?token=${raw}`;

  return {
    ok: true,
    magicUrl: isDevAuthEnabled() ? magicUrl : undefined,
    expiresAt,
    role: user?.role,
  };
}

export async function consumeMagicToken(
  rawToken: string,
): Promise<{ ok: boolean; session?: SessionRecord; error?: string }> {
  const hashed = hash(rawToken);
  const store = await readStore();
  const link = store.magicLinks.find((m) => m.token === hashed && !m.used);
  if (!link) return { ok: false, error: "invalid or used token" };
  if (new Date(link.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "token expired" };
  }

  let user = await findUserByEmail(link.email);
  if (!user) {
    // Promote assignee email to user
    user = {
      id: `user-${randomBytes(4).toString("hex")}`,
      email: link.email,
      role: "assignee",
    };
    await updateStore((s) => {
      s.users.push(user!);
    });
  }

  const sessionToken = token();
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60_000,
  ).toISOString();
  const session: SessionRecord = {
    token: hash(sessionToken),
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  await updateStore((s) => {
    const m = s.magicLinks.find((x) => x.token === hashed);
    if (m) m.used = true;
    s.sessions = s.sessions.filter(
      (x) => new Date(x.expiresAt).getTime() > Date.now(),
    );
    s.sessions.push(session);
  });

  return {
    ok: true,
    session: { ...session, token: sessionToken },
  };
}

/** Instant session for registered emails (dev / cloud preview). */
export async function createDevSession(email: string): Promise<{
  ok: boolean;
  cookieValue?: string;
  user?: WebSightUser;
  error?: string;
}> {
  if (!isDevAuthEnabled()) {
    return { ok: false, error: "dev session disabled — use magic link" };
  }
  let user = await findUserByEmail(email);
  if (!user) {
    const assignees = await listAssignees();
    const hit = assignees.find(
      (a) =>
        a.isActive &&
        a.assigneeEmail.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!hit) {
      // Allow bootstrap admin if email matches fixture admin
      const users = await listUsers();
      if (users.length === 0) {
        return { ok: false, error: "no users" };
      }
      return { ok: false, error: "등록되지 않은 이메일" };
    }
    user = {
      id: `user-${randomBytes(4).toString("hex")}`,
      email: hit.assigneeEmail.toLowerCase(),
      displayName: hit.assigneeName,
      role: "assignee",
    };
    await updateStore((s) => {
      s.users.push(user!);
    });
  }

  const sessionToken = token();
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60_000,
  ).toISOString();
  await updateStore((s) => {
    s.sessions.push({
      token: hash(sessionToken),
      userId: user!.id,
      email: user!.email,
      role: user!.role,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
  });
  return { ok: true, cookieValue: sessionToken, user };
}

export async function resolveSession(
  rawCookie?: string | null,
): Promise<WebSightUser | null> {
  if (!rawCookie) return null;
  const hashed = hash(rawCookie);
  const store = await readStore();
  const session = store.sessions.find((s) => s.token === hashed);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return {
    id: session.userId,
    email: session.email,
    role: session.role,
  };
}

export async function getCurrentUser(): Promise<WebSightUser | null> {
  const jar = await cookies();
  return resolveSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireRole(
  roles: WebSightRole[],
): Promise<WebSightUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}

export function sessionCookieOptions(maxAgeSec = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
    secure: process.env.NODE_ENV === "production",
  };
}
