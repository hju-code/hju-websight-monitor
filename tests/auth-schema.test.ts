import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("account migration supports a clean install, is repeatable, and rejects duplicate emails", async () => {
  const db = new PGlite();
  try {
    const sql = await readFile("db/005_password_auth.sql", "utf8");
    await db.exec(sql);
    await db.exec(sql);
    await db.query("INSERT INTO websight.accounts (id, email, password_hash, role) VALUES ($1,$2,$3,$4)", ["one", "admin@example.org", "hash", "admin"]);
    await assert.rejects(db.query("INSERT INTO websight.accounts (id, email, password_hash, role) VALUES ($1,$2,$3,$4)", ["two", "ADMIN@example.org", "hash", "assignee"]));
    await assert.rejects(db.query("INSERT INTO websight.accounts (id, email, password_hash, role) VALUES ($1,$2,$3,$4)", ["three", "other@example.org", "hash", "viewer"]));
  } finally { await db.close(); }
});
