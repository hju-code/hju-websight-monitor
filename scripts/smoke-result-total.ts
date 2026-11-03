import "dotenv/config";
import { NaverSearchCollector } from "../src/collectors/naver";

async function main() {
  const c = new NaverSearchCollector();
  const r = await c.collect({
    keyword: "혜전대학교",
    engine: "naver",
    tab: "web",
    scanDepth: 10,
  });
  console.log(
    JSON.stringify(
      {
        ok: r.ok,
        status: r.status,
        scanned: r.scanned,
        resultTotal: r.resultTotal,
        first: r.hits[0]?.url,
        notes: r.meta.notes,
        err: r.errorMessage,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
