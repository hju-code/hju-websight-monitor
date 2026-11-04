import { cookies } from "next/headers";
import { getPool } from "../db/pool";
import { AuthService } from "./password-service";
import { database } from "../db/database";
import type { WebSightRole, WebSightUser } from "./types";

export const SESSION_COOKIE = "websight_session";
const SESSION_SECONDS = 3600;
let service: AuthService | null = null;
export function getAuthService(): AuthService {
  if (service) return service;
  service = new AuthService(database());
  return service;
}
export async function initializeAdminIfNeeded(): Promise<void> {
  const pool = getPool();
  const existing = await pool.query("SELECT id FROM websight.accounts LIMIT 1");
  if (existing.rowCount) return;
  const email = process.env.WEBSIGHT_ADMIN_EMAIL;
  const password = process.env.WEBSIGHT_INITIAL_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Initial administrator credentials are not configured");
  await getAuthService().bootstrap(email, password);
}
export async function getCurrentUser(): Promise<WebSightUser | null> {
  return (await getCurrentSession())?.user ?? null;
}
export async function getCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getAuthService().resolveSession(token);
}
export async function requireRole(roles: WebSightRole[]): Promise<WebSightUser | null> {
  const user = await getCurrentUser();
  return user && !user.mustChangePassword && roles.includes(user.role) ? user : null;
}
export function sessionCookieOptions(maxAgeSec = SESSION_SECONDS) {
  return { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: maxAgeSec, secure: process.env.NODE_ENV === "production" };
}
