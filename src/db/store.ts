/**
 * Unified data access — file store always available; PG used when configured
 * for rank/keyword reads that already exist in repository.ts.
 */
import { randomBytes } from "crypto";
import { resolveDatabaseUrl } from "../config/env";
import { getPool } from "./pool";
import { listKeywords, listRecentRanks } from "./repository";
import type { AssignmentScope, WebSightUser } from "../auth/types";
import { defaultEnabledPlatforms } from "../config/platforms";
import { generateDraftFromKnowledge } from "../kin/draft";
import type {
  DraftStatus,
  KnowledgeCategory,
  KnowledgeEntry,
  KinDraft,
  KinQuestion,
} from "../kin/types";
import {
  readStore,
  updateStore,
  type AppSettings,
  type RankRecord,
} from "./file-store";

function id(prefix: string) {
  return `${prefix}-${randomBytes(6).toString("hex")}`;
}

export async function getSettings(): Promise<AppSettings> {
  const s = await readStore();
  return s.settings;
}

export async function savePlatforms(enabled: string[]): Promise<AppSettings> {
  const catalogOk = new Set(
    enabled.filter((e) => typeof e === "string" && e.length > 0),
  );
  const data = await updateStore((store) => {
    store.settings.enabled_platforms = [...catalogOk];
    store.settings.kin_auto_post = false;
    store.settings.updatedAt = new Date().toISOString();
  });
  return data.settings;
}

export async function saveTosSettings(partial: {
  tos_mode?: string;
  snapshot_ttl_days?: number;
  google_enabled?: boolean;
}): Promise<AppSettings> {
  const data = await updateStore((store) => {
    if (partial.tos_mode) store.settings.tos_mode = partial.tos_mode;
    if (typeof partial.snapshot_ttl_days === "number") {
      store.settings.snapshot_ttl_days = partial.snapshot_ttl_days;
    }
    if (typeof partial.google_enabled === "boolean") {
      store.settings.google_enabled = partial.google_enabled;
    }
    store.settings.kin_auto_post = false;
    store.settings.updatedAt = new Date().toISOString();
  });
  return data.settings;
}

export async function getEnabledPlatforms(): Promise<string[]> {
  const s = await getSettings();
  if (Array.isArray(s.enabled_platforms)) return s.enabled_platforms;
  return defaultEnabledPlatforms().enabled;
}

export async function listKeywordsFromStore() {
  if (resolveDatabaseUrl()) return await listKeywords();
  const s = await readStore();
  return s.keywords;
}

export async function addKeyword(phrase: string) {
  const trimmed = phrase.trim();
  if (!trimmed) throw new Error("phrase required");
  if (resolveDatabaseUrl()) {
    const result = await getPool().query("INSERT INTO websight.keywords (phrase,is_brand,is_active,match_mode) VALUES ($1,false,true,'domain_or_name') RETURNING *", [trimmed]);
    return result.rows[0];
  }
  const data = await updateStore((store) => {
    if (store.keywords.some((k) => k.phrase === trimmed)) {
      throw new Error("keyword already exists");
    }
    store.seq.keyword += 1;
    const ts = new Date().toISOString();
    store.keywords.push({
      id: store.seq.keyword,
      phrase: trimmed,
      is_brand: false,
      is_active: true,
      match_mode: "domain_or_name",
      created_at: ts,
      updated_at: ts,
    });
  });
  return data.keywords[data.keywords.length - 1];
}

export async function listRanksFromStore(limit = 100): Promise<RankRecord[]> {
  if (resolveDatabaseUrl()) {
    const rows = await listRecentRanks(limit);
    return rows.map((r) => ({ id: Number(r.id), runId: Number(r.run_id), phrase: r.phrase, engine: r.engine, tab: r.tab, collectedAt: new Date(r.collected_at).toISOString(), schoolRank: r.school_rank, schoolStatus: r.school_status, matchedUrl: r.matched_url, matchedDomain: r.matched_domain, resultTotal: r.result_total == null ? null : Number(r.result_total), requestCount: r.request_count, providerStatus: r.provider_status, source: "live" as const }));
  }
  const s = await readStore();
  return [...s.ranks]
    .map((r) => ({
      ...r,
      resultTotal:
        typeof r.resultTotal === "number" && Number.isFinite(r.resultTotal)
          ? r.resultTotal
          : null,
    }))
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))
    .slice(0, limit);
}

export async function statsSummary() {
  const ranks = await listRanksFromStore(200);
  const enabled = await getEnabledPlatforms();
  const byKey = new Map<string, RankRecord>();
  for (const r of ranks) {
    const key = `${r.phrase}|${r.engine}|${r.tab}`;
    if (!byKey.has(key)) byKey.set(key, r);
  }
  return {
    enabledPlatforms: enabled,
    rows: [...byKey.values()],
    totalSnapshots: ranks.length,
    sampleCount: ranks.filter((r) => r.source === "sample").length,
  };
}

export async function appendRankSnapshots(
  rows: Omit<RankRecord, "id">[],
): Promise<void> {
  await updateStore((store) => {
    store.seq.run += 1;
    const runId = store.seq.run;
    const ts = new Date().toISOString();
    store.runs.push({
      id: runId,
      triggeredBy: "manual",
      startedAt: ts,
      finishedAt: ts,
      status: "ok",
      notes: null,
    });
    for (const row of rows) {
      store.seq.rank += 1;
      store.ranks.push({ ...row, id: store.seq.rank, runId });
    }
  });
}

export async function listKnowledge(): Promise<KnowledgeEntry[]> {
  const s = await readStore();
  return s.knowledge;
}

export async function setKnowledgeActive(id: string, active: boolean): Promise<boolean> {
  let found = false;
  await updateStore(store => {
    const entry = store.knowledge.find(item => item.id === id);
    if (!entry) return;
    entry.isActive = active;
    entry.updatedAt = new Date().toISOString();
    found = true;
  });
  return found;
}

export async function createKnowledge(input: {
  category: KnowledgeCategory;
  title: string;
  body: string;
  revisionLabel?: string;
  summary?: string;
  embedding?: number[];
  embeddingModel?: string;
  images?: { type: string; data: string }[];
  sections?: { page: number; text: string; embedding: number[] }[];
  sourceFileName?: string;
  departmentName?: string;
}): Promise<KnowledgeEntry> {
  let created!: KnowledgeEntry;
  await updateStore((store) => {
    store.seq.knowledge += 1;
    created = {
      id: id("kb"),
      category: input.category,
      title: input.title.trim(),
      body: input.body.trim(),
      revisionLabel: input.revisionLabel?.trim() || undefined,
      isActive: true,
      updatedAt: new Date().toISOString(),
      summary: input.summary,
      embedding: input.embedding,
      embeddingModel: input.embeddingModel,
      images: input.images,
      sections: input.sections,
      sourceFileName: input.sourceFileName,
      departmentName: input.departmentName?.trim() || undefined,
    };
    store.knowledge.unshift(created);
  });
  return created;
}

export async function listQuestions(): Promise<KinQuestion[]> {
  const s = await readStore();
  return [...s.questions].sort((a, b) =>
    b.detectedAt.localeCompare(a.detectedAt),
  );
}

export async function getQuestion(qid: string): Promise<KinQuestion | null> {
  const s = await readStore();
  return s.questions.find((q) => q.id === qid) ?? null;
}

/** A person has checked the original Naver page; this is not automatic verification. */
export async function setManualAnswerStatus(qid: string, answered: boolean): Promise<boolean> {
  let found = false;
  await updateStore(store => {
    const question = store.questions.find(q => q.id === qid);
    if (!question) return;
    found = true;
    question.status = answered ? "manual_posted" : store.drafts.some(d => d.questionId === qid) ? "drafted" : "new";
  });
  return found;
}

export async function getDraftForQuestion(
  qid: string,
): Promise<KinDraft | null> {
  const s = await readStore();
  const drafts = s.drafts.filter((d) => d.questionId === qid);
  return drafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function upsertQuestions(questions: KinQuestion[]): Promise<number> {
  let added = 0;
  await updateStore((store) => {
    for (const q of questions) {
      const exists = store.questions.find(
        (x) => x.naverUrl === q.naverUrl || x.id === q.id,
      );
      if (exists) { exists.matchedKeywords = [...new Set([...(exists.matchedKeywords ?? []), ...(q.matchedKeywords ?? [])])]; continue; }
      store.questions.unshift(q);
      added += 1;
    }
  });
  return added;
}

export async function generateAndStoreDraft(
  questionId: string,
): Promise<{ ok: boolean; draft?: KinDraft; errorMessage?: string }> {
  const s = await readStore();
  const question = s.questions.find((q) => q.id === questionId);
  if (!question) {
    return { ok: false, errorMessage: "question not found" };
  }
  const result = generateDraftFromKnowledge(question, s.knowledge);
  if (!result.ok || !result.draft) {
    return {
      ok: false,
      errorMessage: result.errorMessage ?? "draft failed",
    };
  }
  await updateStore((store) => {
    store.drafts.unshift(result.draft!);
    const q = store.questions.find((x) => x.id === questionId);
    if (q && q.status === "new") q.status = "drafted";
  });
  return { ok: true, draft: result.draft };
}

export async function updateDraftStatus(
  draftId: string,
  status: DraftStatus,
  note?: string,
): Promise<KinDraft | null> {
  let updated: KinDraft | null = null;
  await updateStore((store) => {
    const d = store.drafts.find((x) => x.id === draftId);
    if (!d) return;
    d.status = status;
    d.reviewedAt = new Date().toISOString();
    if (note) d.reviewerNote = note;
    const q = store.questions.find((x) => x.id === d.questionId);
    if (q) {
      if (status === "approved") {
        q.status = "approved";
      } else if (status === "rejected") {
        q.status = "dismissed";
      }
    }
    updated = { ...d };
  });
  return updated;
}

export async function listAssignees(): Promise<AssignmentScope[]> {
  const s = await readStore();
  return s.assignees;
}

export async function upsertAssignee(
  input: Omit<AssignmentScope, "id"> & { id?: string },
): Promise<AssignmentScope> {
  let row!: AssignmentScope;
  await updateStore((store) => {
    if (input.id) {
      const idx = store.assignees.findIndex((a) => a.id === input.id);
      if (idx >= 0) {
        store.assignees[idx] = { ...store.assignees[idx], ...input, id: input.id };
        row = store.assignees[idx];
        return;
      }
    }
    row = {
      id: input.id ?? id("asg"),
      keywordPhrase: input.keywordPhrase,
      siteKey: input.siteKey,
      assigneeEmail: input.assigneeEmail.toLowerCase(),
      assigneeName: input.assigneeName,
      isActive: input.isActive,
    };
    store.assignees.push(row);
    if (!store.users.some((u) => u.email === row.assigneeEmail)) {
      store.users.push({
        id: id("user"),
        email: row.assigneeEmail,
        displayName: row.assigneeName,
        role: "assignee",
      });
    }
  });
  return row;
}

export async function findUserByEmail(
  email: string,
): Promise<WebSightUser | null> {
  const s = await readStore();
  const norm = email.trim().toLowerCase();
  return s.users.find((u) => u.email.toLowerCase() === norm) ?? null;
}

export async function listUsers(): Promise<WebSightUser[]> {
  const s = await readStore();
  return s.users;
}
export async function getDraftById(draftId: string): Promise<KinDraft | null> {
  const store = await readStore();
  return store.drafts.find(d => d.id === draftId) ?? null;
}
export async function saveDraftBody(questionId: string, body: string): Promise<KinDraft | null> {
  if (!body.trim() || body.length > 20000) throw new Error("answer required (maximum 20000 characters)");
  let saved: KinDraft | null = null;
  await updateStore(store => {
    const question = store.questions.find(q => q.id === questionId);
    if (!question) return;
    const existing = store.drafts.filter(d => d.questionId === questionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (existing) { existing.draftBody = body.trim(); existing.status = "pending_review"; saved = { ...existing }; }
    else { saved = { id: id("draft"), questionId, draftBody: body.trim(), sourceKnowledgeIds: [], status: "pending_review", createdAt: new Date().toISOString() }; store.drafts.unshift(saved); }
    if (question.status !== "manual_posted") question.status = "drafted";
  });
  return saved;
}
