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
    // Prefer schema websight via search_path after connect
  });
  pool.on("connect", (client) => {
    void client.query(`SET search_path TO ${quoteIdent(env.dbSchema)}, public`);
  });
  return pool;
}

function quoteIdent(ident: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ident)) {
    throw new Error(`Unsafe DB schema name: ${ident}`);
  }
  return `"${ident}"`;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
