import "dotenv/config";
import { deleteExpiredSnapshots } from "../db/repository";
import { closePool } from "../db/pool";

/** Delete rank_snapshots past expires_at (TTL ≤ 21d default). */
async function main() {
  const deleted = await deleteExpiredSnapshots();
  console.log(JSON.stringify({ deleted, at: new Date().toISOString() }));
  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
