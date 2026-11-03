/**
 * File-backed store for cloud / no-PG environments.
 * When WEBSIGHT_DATABASE_URL is set, repository.ts prefers PostgreSQL;
 * APIs still fall back here on connection failure for local/demo UX.
 *
 * Path: data/websight-store.json (gitignored). Auto-posts NEVER stored as enabled.
 */
import { promises as fs } from "fs";
import path from "path";
import { FIXTURE_ADMIN, FIXTURE_ASSIGNEE, FIXTURE_ASSIGNMENTS } from "../auth/fixtures";
import type { AssignmentScope, WebSightUser } from "../auth/types";
import { defaultEnabledPlatforms } from "../config/platforms";
import { SEED_KEYWORDS } from "../config/seeds";
import {
  FIXTURE_DRAFT,
  FIXTURE_KNOWLEDGE,
  FIXTURE_QUESTION,
} from "../kin/fixtures";
import type { KnowledgeEntry, KinDraft, KinQuestion } from "../kin/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "websight-store.json");

export interface RankRecord {
  id: number;
  runId: number;
  phrase: string;
  engine: string;
  tab: string;
  collectedAt: string;
  schoolRank: number | null;
  schoolStatus: "ok" | "not_found" | "error" | "skipped";
  matchedUrl: string | null;
  matchedDomain: string | null;
  requestCount: number;
  providerStatus: string | null;
  source: "live" | "sample" | "dry-run";
}

export interface KeywordRecord {
  id: number;
  phrase: string;
  is_brand: boolean;
  is_active: boolean;
  match_mode: string;
  created_at: string;
  updated_at: string;
}

export interface RunRecord {
  id: number;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  notes: string | null;
}

export interface AppSettings {
  tos_mode: string;
  snapshot_ttl_days: number;
  google_enabled: boolean;
  kin_auto_post: false;
  enabled_platforms: string[];
  updatedAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  role: "admin" | "assignee";
  createdAt: string;
  expiresAt: string;
}

export interface MagicLinkRecord {
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export interface FileStoreData {
  version: 1;
  keywords: KeywordRecord[];
  ranks: RankRecord[];
  runs: RunRecord[];
  knowledge: KnowledgeEntry[];
  questions: KinQuestion[];
  drafts: KinDraft[];
  assignees: AssignmentScope[];
  users: WebSightUser[];
  settings: AppSettings;
  sessions: SessionRecord[];
  magicLinks: MagicLinkRecord[];
  seq: {
    keyword: number;
    rank: number;
    run: number;
    knowledge: number;
    question: number;
    draft: number;
  };
}

function nowIso() {
  return new Date().toISOString();
}

function sampleRanks(): RankRecord[] {
  const day = nowIso();
  return [
    {
      id: 1,
      runId: 1,
      phrase: "혜전대학교",
      engine: "naver",
      tab: "web",
      collectedAt: day,
      schoolRank: 3,
      schoolStatus: "ok",
      matchedUrl: "https://www.hj.ac.kr/",
      matchedDomain: "hj.ac.kr",
      requestCount: 1,
      providerStatus: "ok",
      source: "sample",
    },
    {
      id: 2,
      runId: 1,
      phrase: "혜전대학교",
      engine: "daum",
      tab: "web",
      collectedAt: day,
      schoolRank: 5,
      schoolStatus: "ok",
      matchedUrl: "https://www.hj.ac.kr/",
      matchedDomain: "hj.ac.kr",
      requestCount: 2,
      providerStatus: "ok",
      source: "sample",
    },
    {
      id: 3,
      runId: 1,
      phrase: "혜전대",
      engine: "naver",
      tab: "web",
      collectedAt: day,
      schoolRank: 2,
      schoolStatus: "ok",
      matchedUrl: "https://www.hj.ac.kr/",
      matchedDomain: "hj.ac.kr",
      requestCount: 1,
      providerStatus: "ok",
      source: "sample",
    },
    {
      id: 4,
      runId: 1,
      phrase: "혜전대",
      engine: "daum",
      tab: "web",
      collectedAt: day,
      schoolRank: null,
      schoolStatus: "not_found",
      matchedUrl: null,
      matchedDomain: null,
      requestCount: 2,
      providerStatus: "ok",
      source: "sample",
    },
    {
      id: 5,
      runId: 1,
      phrase: "혜전대학교",
      engine: "youtube",
      tab: "web",
      collectedAt: day,
      schoolRank: 12,
      schoolStatus: "ok",
      matchedUrl: "https://www.youtube.com/@hyejeon",
      matchedDomain: "youtube.com",
      requestCount: 0,
      providerStatus: "sample",
      source: "sample",
    },
  ];
}

function defaultStore(): FileStoreData {
  const ts = nowIso();
  const defaults = defaultEnabledPlatforms();
  return {
    version: 1,
    keywords: SEED_KEYWORDS.map((k, i) => ({
      id: i + 1,
      phrase: k.phrase,
      is_brand: k.is_brand,
      is_active: true,
      match_mode: k.match_mode,
      created_at: ts,
      updated_at: ts,
    })),
    ranks: sampleRanks(),
    runs: [
      {
        id: 1,
        triggeredBy: "test",
        startedAt: ts,
        finishedAt: ts,
        status: "ok",
        notes: "sample seed for /stats UX",
      },
    ],
    knowledge: [...FIXTURE_KNOWLEDGE],
    questions: [{ ...FIXTURE_QUESTION }],
    drafts: [{ ...FIXTURE_DRAFT }],
    assignees: [...FIXTURE_ASSIGNMENTS],
    users: [FIXTURE_ADMIN, FIXTURE_ASSIGNEE],
    settings: {
      tos_mode: "derived_meta",
      snapshot_ttl_days: 21,
      google_enabled: false,
      kin_auto_post: false,
      enabled_platforms: [...defaults.enabled],
      updatedAt: ts,
    },
    sessions: [],
    magicLinks: [],
    seq: {
      keyword: SEED_KEYWORDS.length,
      rank: sampleRanks().length,
      run: 1,
      knowledge: FIXTURE_KNOWLEDGE.length,
      question: 1,
      draft: 1,
    },
  };
}

let memoryCache: FileStoreData | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function ensureLoaded(): Promise<FileStoreData> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    memoryCache = JSON.parse(raw) as FileStoreData;
    return memoryCache;
  } catch {
    memoryCache = defaultStore();
    await persist(memoryCache);
    return memoryCache;
  }
}

async function persist(data: FileStoreData): Promise<void> {
  memoryCache = data;
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${STORE_PATH}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, STORE_PATH);
  });
  await writeChain;
}

export async function readStore(): Promise<FileStoreData> {
  return ensureLoaded();
}

export async function updateStore(
  mutator: (data: FileStoreData) => void | Promise<void>,
): Promise<FileStoreData> {
  const data = await ensureLoaded();
  await mutator(data);
  await persist(data);
  return data;
}

export function storePath(): string {
  return STORE_PATH;
}

export async function resetStoreForTests(): Promise<void> {
  memoryCache = defaultStore();
  await persist(memoryCache);
}
