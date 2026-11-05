import { getPool } from "../db/pool";
const COLLECTION_LOCK = 527391042;
const KIN_DETECTION_LOCK = 527391043;
/** Keep the advisory lock inside a transaction so transaction-pooling proxies release it safely. */
async function withAdvisoryLock<T>(key: number, action: () => Promise<T>): Promise<{ acquired: boolean; value?: T }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_xact_lock($1) AS locked", [key]);
    if (!result.rows[0].locked) { await client.query("ROLLBACK"); return { acquired: false }; }
    const value = await action();
    await client.query("COMMIT");
    return { acquired: true, value };
  } catch (error) { try { await client.query("ROLLBACK"); } catch {} throw error; }
  finally { client.release(); }
}
export function withCollectionLock<T>(action: () => Promise<T>) { return withAdvisoryLock(COLLECTION_LOCK, action); }
/** Scheduled and manual Kin detection share this lock so they never overlap. */
export function withKinDetectionLock<T>(action: () => Promise<T>) { return withAdvisoryLock(KIN_DETECTION_LOCK, action); }
