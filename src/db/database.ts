import type { AuthDatabase } from "../auth/password-service";
import { getPool } from "./pool";
export function database(): AuthDatabase {
  const pool = getPool();
  return {
    query: async (sql, args) => pool.query(sql, args),
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const value = await fn({ query: async (sql, args) => client.query(sql, args) });
        await client.query("COMMIT");
        return value;
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    },
  };
}
