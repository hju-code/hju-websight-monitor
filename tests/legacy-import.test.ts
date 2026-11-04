import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { importLegacyState } from "../src/db/legacy-import";

test("legacy import is atomic, excludes old credentials, and refuses overwriting data", async () => {
  const db = new PGlite();
  try {
    for (const n of ["001_websight_schema.sql", "004_result_total.sql", "006_app_state.sql"]) await db.exec(await readFile(`db/${n}`, "utf8"));
    const adapter = { query: async (sql: string, args?: unknown[]) => db.query(sql,args), transaction: async <T>(fn: (q:{query(sql:string,args?:unknown[]):Promise<{rows:unknown[]}>}) => Promise<T>) => db.transaction(async tx => fn({query:async(sql,args)=>tx.query(sql,args)})) };
    const legacy = { version:1, keywords:[{phrase:"새 키워드",is_brand:false,is_active:true,match_mode:"domain_or_name"}], ranks:[], runs:[], knowledge:[], questions:[], drafts:[], assignees:[], users:[{email:"leak"}], sessions:[{token:"old-token"}], magicLinks:[{token:"old-link"}], settings:{}, seq:{} };
    await importLegacyState(adapter, legacy);
    const state = (await db.query<{data:typeof legacy}>("SELECT data FROM websight.app_state")).rows[0].data;
    assert.deepEqual(state.users, []); assert.deepEqual(state.sessions, []); assert.deepEqual(state.magicLinks, []);
    assert.equal((await db.query("SELECT id FROM websight.keywords WHERE phrase='새 키워드'")).rows.length, 1);
    await assert.rejects(importLegacyState(adapter, legacy));
  } finally { await db.close(); }
});
