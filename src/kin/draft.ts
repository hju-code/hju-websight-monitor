import type {
  DraftGenerateResult,
  KnowledgeEntry,
  KinDraft,
  KinQuestion,
} from "./types";

/**
 * Draft answer from admin knowledge base.
 * Heuristic stub for P1 scaffold — replace with better retrieval later.
 * NEVER calls Naver write/post APIs.
 */
export function generateDraftFromKnowledge(
  question: KinQuestion,
  knowledge: KnowledgeEntry[],
): DraftGenerateResult {
  const active = knowledge.filter((k) => k.isActive);
  if (active.length === 0) {
    return {
      ok: false,
      autoPostEnabled: false,
      errorMessage:
        "활성 학과·입시 정보가 없습니다. 관리자 지식 베이스를 먼저 입력하세요.",
    };
  }

  const q = `${question.title} ${question.questionText}`.toLowerCase();
  const scored = active
    .map((k) => {
      const hay = `${k.title} ${k.body} ${k.category}`.toLowerCase();
      let score = 0;
      for (const token of q.split(/\s+/).filter((t) => t.length > 1)) {
        if (hay.includes(token)) score += 1;
      }
      if (q.includes("입시") && k.category === "admission") score += 3;
      if (q.includes("학과") && k.category === "department") score += 3;
      return { k, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 3);
  const used = top.length > 0 ? top.map((t) => t.k) : active.slice(0, 2);

  const draftBody = [
    "안녕하세요. 혜전대학교 관련 안내에 참고가 될 수 있는 내용입니다.",
    "",
    ...used.map(
      (k) =>
        `【${k.title}】${k.revisionLabel ? ` (${k.revisionLabel})` : ""}\n${k.body}`,
    ),
    "",
    "※ 최신·정확한 내용은 혜전대학교 공식 홈페이지(hj.ac.kr)와 입학처 공지를 확인해 주세요.",
    "※ 이 문구는 관리자 검토용 초안이며, 시스템에 의해 네이버에 자동 게시되지 않습니다.",
  ].join("\n");

  const draft: KinDraft = {
    id: `draft-${Date.now()}`,
    questionId: question.id,
    draftBody,
    sourceKnowledgeIds: used.map((k) => k.id),
    status: "pending_review",
    createdAt: new Date().toISOString(),
  };

  return { ok: true, draft, autoPostEnabled: false };
}

/** Product invariant helper for UI/API. */
export function isAutoPostAllowed(): false {
  return false;
}
