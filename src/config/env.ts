/** Non-secret env surface. Values come from .env / server env — never invent secrets. */

export interface AppEnv {
  databaseUrl: string | undefined;
  dbSchema: string;
  adminToken: string | undefined;
  googleEnabled: boolean;
  port: number;
  appBaseUrl: string | undefined;
}

export function loadAppEnv(): AppEnv {
  return {
    databaseUrl:
      process.env.WEBSIGHT_DATABASE_URL || process.env.POSTGRES_URL || undefined,
    dbSchema: process.env.DB_SCHEMA || "websight",
    adminToken: process.env.WEBSIGHT_ADMIN_TOKEN || undefined,
    googleEnabled: process.env.GOOGLE_ENABLED === "true",
    port: Number(process.env.PORT || 3040),
    appBaseUrl: process.env.WEBSIGHT_BASE_URL || undefined,
  };
}
