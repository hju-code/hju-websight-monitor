/**
 * Dry-run: call Naver/Daum collectors + matcher WITHOUT DB write.
 * Requires API keys in env; prints derived meta only (no title/snippet dump).
 *
 *   cp .env.example .env   # fill campus keys
 *   npx tsx scripts/dry-run-collect.ts
 */
import "dotenv/config";
import { collectWeb } from "../src/collectors";
import { SEED_KEYWORDS } from "../src/config/seeds";
import { matchSchool, toDerivedMeta } from "../src/matcher/school";

async function main() {
  const out = [];
  for (const kw of SEED_KEYWORDS) {
    for (const engine of ["naver", "daum"] as const) {
      const result = await collectWeb(engine, kw.phrase, 100);
      const match = matchSchool(result.hits);
      const derived = toDerivedMeta(match);
      // discard ephemeral hits
      result.hits.length = 0;
      out.push({
        keyword: kw.phrase,
        engine,
        status: result.status,
        errorMessage: result.errorMessage,
        requestCount: result.meta.requestCount,
        scanned: result.scanned,
        notes: result.meta.notes,
        ...derived,
      });
    }
  }
  console.log(JSON.stringify({ mode: "dry-run", derivedOnly: true, results: out }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
