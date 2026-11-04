/** Non-secret env surface. Values come from .env / server env — never invent secrets. */

export interface AppEnv {
  databaseUrl: string | undefined;
  dbSchema: string;
  adminToken: string | undefined;
  googleEnabled: boolean;
  port: number;
  appBaseUrl: string | undefined;
}

/**
 * Ignore placeholder / local-only URLs on Vercel so ranks don't pretend PG is ready.
 * Real remote Postgres URLs still pass through.
 */
export function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.VERCEL_ENV === "preview"
    ? process.env.WEBSIGHT_PREVIEW_DATABASE_URL
    : process.env.WEBSIGHT_DATABASE_URL || process.env.POSTGRES_URL || undefined;
  if (!raw?.trim()) return undefined;
  const onVercel =
    process.env.VERCEL === "1" || process.env.VERCEL === "true";
  if (
    onVercel &&
    (/CHANGE_ME/i.test(raw) ||
      /@(localhost|127\.0\.0\.1)([:/]|$)/i.test(raw))
  ) {
    return undefined;
  }
  return raw;
}

export function loadAppEnv(): AppEnv {
  return {
    databaseUrl: resolveDatabaseUrl(),
    dbSchema: process.env.DB_SCHEMA || "websight",
    adminToken: process.env.WEBSIGHT_ADMIN_TOKEN || undefined,
    googleEnabled: process.env.GOOGLE_ENABLED === "true",
    port: Number(process.env.PORT || 3040),
    appBaseUrl: process.env.WEBSIGHT_BASE_URL || undefined,
  };
}
