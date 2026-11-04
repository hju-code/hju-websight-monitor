import { timingSafeEqual } from "node:crypto";
export function authorizedCron(secret: string | undefined, header: string | null | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`); const supplied = Buffer.from(header);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
