import "dotenv/config";
import { readFile } from "node:fs/promises";
import { database } from "../src/db/database";
import { closePool } from "../src/db/pool";
import { importLegacyState } from "../src/db/legacy-import";
const [file, flag] = process.argv.slice(2);
if (!file || flag !== "--apply") {
  console.error("Usage: npm run import-legacy -- <backup.json> --apply (only before app state initialization)");
  process.exitCode = 2;
} else {
  try {
    const data: unknown = JSON.parse(await readFile(file, "utf8"));
    const counts = await importLegacyState(database(), data);
    console.log(JSON.stringify({ ok: true, ...counts }));
  } catch (error) {
    console.error(`Import failed: ${error instanceof Error ? error.message : "unknown error"}`);
    process.exitCode = 1;
  } finally { await closePool(); }
}
