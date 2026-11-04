/**
 * Knowledge-base + Naver Kin (지식iN) assisted-reply types.
 *
 * HARD RULE: never auto-post answers to Naver.
 * Admin reviews drafts → approve in-app OR open Naver link and paste manually.
 */

export type KnowledgeCategory =
  | "department"
  | "admission"
  | "tuition"
  | "campus"
  | "other";

/** Admin-maintained school facts (dept / admissions), renewed yearly/periodically. */
export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  body: string;
  /** Academic year or revision label, e.g. "2027 입시" */
  revisionLabel?: string;
  isActive: boolean;
  updatedAt: string; // ISO
  updatedBy?: string;
  summary?: string;
  embedding?: number[];
  embeddingModel?: string;
  images?: { type: string; data: string }[];
  sections?: { page: number; text: string; embedding: number[] }[];
  sourceFileName?: string;
  departmentName?: string;
}

export type KinDetectStatus = "new" | "drafted" | "approved" | "dismissed" | "manual_posted";

/** Detected Kin question metadata — question text kept for admin review only. */
export interface KinQuestion {
  id: string;
  naverUrl: string;
  naverDocId?: string;
  title: string;
  /** Question body excerpt for review UI (admin workspace — not SERP raw dump) */
  questionText: string;
  detectedAt: string;
  status: KinDetectStatus;
  matchedAliases: string[];
  matchedKeywords?: string[];
}

export type DraftStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "copied_for_manual_post";

export interface KinDraft {
  id: string;
  questionId: string;
  draftBody: string;
  /** Knowledge entry ids used to build the draft */
  sourceKnowledgeIds: string[];
  status: DraftStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
  savedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface DraftGenerateRequest {
  questionId: string;
  /** If omitted, use all active knowledge */
  knowledgeIds?: string[];
}

export interface DraftGenerateResult {
  ok: boolean;
  draft?: KinDraft;
  errorMessage?: string;
  /** Always false — product invariant */
  autoPostEnabled: false;
}

/** UI review payload: question ‖ draft side-by-side */
export interface KinReviewView {
  question: KinQuestion;
  draft: KinDraft | null;
  knowledgeHints: Pick<KnowledgeEntry, "id" | "title" | "category">[];
  actions: {
    approve: boolean;
    reject: boolean;
    /** Opens naverUrl — admin pastes manually. NO API post. */
    openNaverToPaste: boolean;
    autoPost: false;
  };
}
