import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { AuthService } from "../src/auth/password-service";

test("bootstrap is one-time; changed passwords revoke sessions", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile("db/005_password_auth.sql", "utf8"));
    const auth = new AuthService({
      query: async (sql, args) => db.query(sql, args),
      transaction: async (fn) => db.transaction(async (tx) => fn({ query: async (sql, args) => tx.query(sql, args) })),
    });
    await auth.bootstrap("admin@example.org", "initial-password-42");
    await auth.bootstrap("admin@example.org", "different-password-42");
    assert.equal(await auth.login("admin@example.org", "different-password-42"), null);
    const login = await auth.login("admin@example.org", "initial-password-42");
    assert.ok(login);
    assert.equal(login.user.mustChangePassword, true);
    assert.equal((await auth.resolve(login.token))?.email, "admin@example.org");
    assert.equal(await auth.changePassword(login.user.id, "bad-password-000", "replacement-password-42"), false);
    assert.equal(await auth.changePassword(login.user.id, "initial-password-42", "replacement-password-42"), true);
    assert.equal(await auth.resolve(login.token), null);
    assert.equal(await auth.login("admin@example.org", "initial-password-42"), null);
    assert.ok(await auth.login("admin@example.org", "replacement-password-42"));
  } finally { await db.close(); }
});
test("user creation and deactivation revoke access", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile("db/005_password_auth.sql", "utf8"));
    const auth = new AuthService({ query: async (sql, args) => db.query(sql, args), transaction: async (fn) => db.transaction(async (tx) => fn({ query: async (sql, args) => tx.query(sql, args) })) });
    const account = await auth.createUser("person@example.org", "initial-password-42", "담당자");
    const login = await auth.login("person@example.org", "initial-password-42");
    assert.ok(login);
    await auth.setActive(account.id, false);
    assert.equal(await auth.resolve(login.token), null);
    assert.equal(await auth.login("person@example.org", "initial-password-42"), null);
    await assert.rejects(auth.createUser("PERSON@example.org", "other-password-42", "중복"));
  } finally { await db.close(); }
});
test("five failed logins lock an account until reset", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile("db/005_password_auth.sql", "utf8"));
    const auth = new AuthService({ query: async (sql, args) => db.query(sql, args), transaction: async (fn) => db.transaction(async (tx) => fn({ query: async (sql, args) => tx.query(sql, args) })) });
    const account = await auth.createUser("lock@example.org", "initial-password-42");
    for (let i = 0; i < 5; i++) assert.equal(await auth.login("lock@example.org", "incorrect-password"), null);
    assert.equal(await auth.login("lock@example.org", "initial-password-42"), null);
    await auth.resetPassword(account.id, "reset-password-for-test-42");
    assert.ok(await auth.login("lock@example.org", "reset-password-for-test-42"));
  } finally { await db.close(); }
});
test("password change rejects repeated incorrect current passwords", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile("db/005_password_auth.sql", "utf8"));
    const auth = new AuthService({ query: async (sql, args) => db.query(sql, args), transaction: async (fn) => db.transaction(async (tx) => fn({ query: async (sql, args) => tx.query(sql, args) })) });
    const account = await auth.createUser("change@example.org", "initial-password-42");
    for (let i = 0; i < 5; i++) assert.equal(await auth.changePassword(account.id, "wrong-password", "new-password-for-test-42"), false);
    assert.equal(await auth.changePassword(account.id, "initial-password-42", "new-password-for-test-42"), false);
  } finally { await db.close(); }
});
