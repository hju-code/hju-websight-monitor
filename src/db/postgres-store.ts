import type { AuthDatabase } from "../auth/password-service";

/** A transactional store for the legacy application data; no process-local cache. */
export class PostgresStore<T> {
  constructor(private db: AuthDatabase, private defaults: () => T) {}
  async read(): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.query("INSERT INTO websight.app_state (id,data) VALUES (1,$1::jsonb) ON CONFLICT (id) DO NOTHING", [JSON.stringify(this.defaults())]);
      const result = await tx.query("SELECT data FROM websight.app_state WHERE id=1");
      return (result.rows[0] as { data: T }).data;
    });
  }
  async update(mutator: (data: T) => void | Promise<void>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.query("INSERT INTO websight.app_state (id,data) VALUES (1,$1::jsonb) ON CONFLICT (id) DO NOTHING", [JSON.stringify(this.defaults())]);
      const result = await tx.query("SELECT data FROM websight.app_state WHERE id=1 FOR UPDATE");
      const data = (result.rows[0] as { data: T }).data;
      await mutator(data);
      await tx.query("UPDATE websight.app_state SET data=$1::jsonb WHERE id=1", [JSON.stringify(data)]);
      return data;
    });
  }
}
