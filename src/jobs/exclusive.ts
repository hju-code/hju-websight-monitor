import { getPool } from "../db/pool";
/** Keep the advisory lock inside a transaction so transaction-pooling proxies release it safely. */
export async function withCollectionLock<T>(action: () => Promise<T>): Promise<{ acquired: boolean; value?: T }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_xact_lock($1) AS locked", [527391042]);
    if (!result.rows[0].locked) { await client.query("ROLLBACK"); return { acquired: false }; }
    const value = await action();
    await client.query("COMMIT");
    return { acquired: true, value };
  } catch (error) { try { await client.query("ROLLBACK"); } catch {} throw error; }
  finally { client.release(); }
}
