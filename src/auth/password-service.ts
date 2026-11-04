import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword, validatePassword, verifyPassword } from "./password";

export interface Queryable { query(sql: string, args?: unknown[]): Promise<{ rows: unknown[] }> }
export interface AuthDatabase extends Queryable { transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> }
export interface Account { id: string; email: string; displayName?: string; role: "admin" | "assignee"; mustChangePassword: boolean; isActive: boolean }
type AccountRow = { id: string; email: string; display_name: string | null; role: "admin" | "assignee"; password_hash: string; is_active: boolean; must_change_password: boolean; locked_until: Date | string | null };
function publicAccount(row: AccountRow): Account { return { id: row.id, email: row.email, displayName: row.display_name ?? undefined, role: row.role, mustChangePassword: row.must_change_password, isActive: row.is_active }; }
const DUMMY_HASH = "scrypt-v1:d4a3eed5670e04446b7492f2fb91195b:6dec9b875b4e787bd60d2366fa953858dcc7a4ace4f2b9a38e80fc5feb5e7df5";
function digest(token: string): string { return createHash("sha256").update(token).digest("hex"); }

export class AuthService {
  constructor(private db: AuthDatabase) {}
  async bootstrap(email: string, password: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || !validatePassword(password)) throw new Error("Invalid initial administrator credentials");
    const passwordHash = await hashPassword(password);
    await this.db.transaction(async (tx) => {
      await tx.query("LOCK TABLE websight.accounts IN EXCLUSIVE MODE");
      const result = await tx.query("SELECT id FROM websight.accounts LIMIT 1");
      if (result.rows.length) return;
      await tx.query("INSERT INTO websight.accounts (id,email,password_hash,role,must_change_password) VALUES ($1,$2,$3,'admin',true)", [randomUUID(), normalized, passwordHash]);
    });
  }
  async login(email: string, password: string): Promise<{ token: string; user: Account } | null> {
    if (typeof email !== "string" || email.length > 254 || typeof password !== "string" || Buffer.byteLength(password) > 1024) return null;
    return this.db.transaction(async (tx) => {
      const result = await tx.query("SELECT * FROM websight.accounts WHERE lower(email)=$1 FOR UPDATE", [email.trim().toLowerCase()]);
      const row = result.rows[0] as AccountRow | undefined;
      if (!row || !row.is_active || (row.locked_until && new Date(row.locked_until).getTime() > Date.now())) {
        await verifyPassword(password, DUMMY_HASH);
        return null;
      }
      if (!(await verifyPassword(password, row.password_hash))) {
        await tx.query("UPDATE websight.accounts SET failed_attempts=failed_attempts+1, locked_until=CASE WHEN failed_attempts+1 >= 5 THEN now()+interval '15 minutes' ELSE NULL END WHERE id=$1", [row.id]);
        return null;
      }
      await tx.query("UPDATE websight.accounts SET failed_attempts=0, locked_until=NULL WHERE id=$1", [row.id]);
      const token = randomBytes(32).toString("hex");
      await tx.query("INSERT INTO websight.password_sessions (token_hash,account_id,expires_at) VALUES ($1,$2,now()+interval '7 days')", [digest(token), row.id]);
      return { token, user: publicAccount(row) };
    });
  }
  async resolve(token: string): Promise<Account | null> {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const result = await this.db.query("SELECT a.* FROM websight.password_sessions s JOIN websight.accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.expires_at>now() AND a.is_active=true", [digest(token)]);
    const row = result.rows[0] as AccountRow | undefined;
    return row ? publicAccount(row) : null;
  }
  async createUser(email: string, password: string, displayName?: string): Promise<Account> {
    const normalized = email.trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("invalid email");
    const hash = await hashPassword(password);
    const result = await this.db.query("INSERT INTO websight.accounts (id,email,display_name,password_hash,role,must_change_password) VALUES ($1,$2,$3,$4,'assignee',true) RETURNING *", [randomUUID(), normalized, displayName?.trim().slice(0, 100) || null, hash]);
    return publicAccount(result.rows[0] as AccountRow);
  }
  async listUsers(): Promise<Account[]> {
    const result = await this.db.query("SELECT * FROM websight.accounts ORDER BY created_at");
    return (result.rows as AccountRow[]).map(publicAccount);
  }
  async setActive(id: string, active: boolean): Promise<void> {
    await this.db.transaction(async (tx) => {
      const result = await tx.query("UPDATE websight.accounts SET is_active=$2,updated_at=now() WHERE id=$1 AND role='assignee' RETURNING id", [id, active]);
      if (!result.rows.length) throw new Error("user not found");
      if (!active) await tx.query("DELETE FROM websight.password_sessions WHERE account_id=$1", [id]);
    });
  }
  async resetPassword(id: string, password: string): Promise<void> {
    const hash = await hashPassword(password);
    await this.db.transaction(async (tx) => {
      const result = await tx.query("UPDATE websight.accounts SET password_hash=$2,must_change_password=true,failed_attempts=0,locked_until=NULL,updated_at=now() WHERE id=$1 AND role='assignee' RETURNING id", [id, hash]);
      if (!result.rows.length) throw new Error("user not found");
      await tx.query("DELETE FROM websight.password_sessions WHERE account_id=$1", [id]);
    });
  }
  async logout(token: string): Promise<void> {
    if (/^[a-f0-9]{64}$/.test(token)) await this.db.query("DELETE FROM websight.password_sessions WHERE token_hash=$1", [digest(token)]);
  }
  async changePassword(id: string, current: string, next: string): Promise<boolean> {
    if (!validatePassword(next)) return false;
    const nextHash = await hashPassword(next);
    return this.db.transaction(async (tx) => {
      const result = await tx.query("SELECT * FROM websight.accounts WHERE id=$1 AND is_active=true FOR UPDATE", [id]);
      const row = result.rows[0] as AccountRow | undefined;
      if (!row || (row.locked_until && new Date(row.locked_until).getTime() > Date.now())) return false;
      if (!(await verifyPassword(current, row.password_hash))) {
        await tx.query("UPDATE websight.accounts SET failed_attempts=failed_attempts+1, locked_until=CASE WHEN failed_attempts+1 >= 5 THEN now()+interval '15 minutes' ELSE NULL END WHERE id=$1", [id]);
        return false;
      }
      await tx.query("UPDATE websight.accounts SET password_hash=$2, must_change_password=false, failed_attempts=0, locked_until=NULL, updated_at=now() WHERE id=$1", [id, nextHash]);
      await tx.query("DELETE FROM websight.password_sessions WHERE account_id=$1", [id]);
      return true;
    });
  }
}
