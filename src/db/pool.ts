import { Pool } from "pg";
import { loadAppEnv } from "../config/env";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const env = loadAppEnv();
  if (!env.databaseUrl) {
    throw new Error(
      "WEBSIGHT_DATABASE_URL (or POSTGRES_URL) is not set. Use campus server env — do not invent credentials.",
    );
  }
  pool = new Pool({
    connectionString: env.databaseUrl,
    max: 5,
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
