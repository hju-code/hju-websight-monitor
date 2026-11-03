import { DaumKakaoCollector } from "./daum";
import { GooglePseCollector } from "./google";
import { NaverKinDetector } from "./naver-kin";
import { NaverSearchCollector } from "./naver";
import type {
  CollectRequest,
  CollectResult,
  Collector,
  Engine,
  Tab,
} from "./types";

const collectors: Collector[] = [
  new NaverSearchCollector(),
  new DaumKakaoCollector(),
  new GooglePseCollector(),
  new NaverKinDetector(),
];

export function listCollectors(): Collector[] {
  return [...collectors];
}

export function getCollector(engine: Engine, tab: Tab): Collector | undefined {
  return collectors.find((c) => c.supports(engine, tab));
}

/** Convenience: collect one keyword on a P1 web channel with retainRaw=none. */
export async function collectWeb(
  engine: "naver" | "daum",
  keyword: string,
  scanDepth = 100,
): Promise<CollectResult> {
  const collector = getCollector(engine, "web");
  if (!collector) {
    return {
      ok: false,
      hits: [],
      scanned: 0,
      status: "unsupported",
      errorMessage: `No collector for ${engine}/web`,
      meta: {
        requestCount: 0,
        provider: "registry",
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  const req: CollectRequest = {
    keyword,
    engine,
    tab: "web",
    device: "desktop",
    scanDepth,
    retainRaw: "none",
  };
  return collector.collect(req);
}
