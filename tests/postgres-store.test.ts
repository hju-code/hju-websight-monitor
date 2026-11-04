import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { PostgresStore } from "../src/db/postgres-store";

test("store changes survive independent reads and failed updates roll back", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE SCHEMA websight; CREATE TABLE websight.app_state (id integer PRIMARY KEY CHECK(id=1), data jsonb NOT NULL)");
    const adapter = { query: async (sql: string, args?: unknown[]) => db.query(sql, args), transaction: async <T>(fn: (q: {query(sql:string,args?:unknown[]):Promise<{rows:unknown[]}>}) => Promise<T>) => db.transaction(async tx => fn({ query: async (sql, args) => tx.query(sql,args) })) };
    const store = new PostgresStore(adapter, () => ({ count: 0 }));
    await store.update(x => { x.count++; });
    assert.equal((await new PostgresStore(adapter, () => ({ count: 0 })).read()).count, 1);
    await assert.rejects(store.update(x => { x.count++; throw new Error("failure"); }));
    assert.equal((await store.read()).count, 1);
  } finally { await db.close(); }
});
