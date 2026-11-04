import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scryptCallback(password, salt, 32, options, (error, key) => error ? reject(error) : resolve(key)));
}
const options = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
export function validatePassword(password: string): boolean {
  return typeof password === "string" && [...password].length >= 9 && Buffer.byteLength(password, "utf8") <= 1024;
}
export async function hashPassword(password: string): Promise<string> {
  if (!validatePassword(password)) throw new Error("password must be at least 9 characters and at most 1024 bytes");
  const salt = randomBytes(16);
  const result = (await scrypt(password, salt)) as Buffer;
  return `scrypt-v1:${salt.toString("hex")}:${result.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 1024) return false;
  const match = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(encoded);
  if (!match) return false;
  const expected = Buffer.from(match[2], "hex");
  const actual = (await scrypt(password, Buffer.from(match[1], "hex"))) as Buffer;
  return timingSafeEqual(expected, actual);
}
