export type AnswerKnowledge = { title: string; summary: string; embedding: number[]; kind: "admission" | "department" | "extra"; departmentName?: string };

function cosine(a: number[], b: number[]) {
  if (a.length !== b.length) return -1;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : -1;
}
export type AnswerScope = "university" | "department" | "both";
export function selectAnswerKnowledge(query: number[], entries: AnswerKnowledge[], department: string, scope: AnswerScope = department ? "both" : "university"): AnswerKnowledge[] {
  const admission = entries.filter(e => e.kind === "admission").map(e => ({ e, score: cosine(query, e.embedding) })).filter(x => x.score > 0.25).sort((a, b) => b.score - a.score).slice(0, 4).map(x => x.e);
  if (scope !== "department" && !admission.length) throw new Error("관련 모집요강 내용을 찾지 못했습니다. 모집요강과 작성 주제를 확인해 주세요.");
  const extras = entries.filter(e => e.kind === "extra").map(e => ({ e, score: cosine(query, e.embedding) })).filter(x => x.score > 0.25).sort((a, b) => b.score - a.score).slice(0, 2).map(x => x.e);
  if (scope === "university") return [...admission, ...extras];
  const dept = entries.filter(e => e.kind === "department" && e.departmentName === department).map(e => ({ e, score: cosine(query, e.embedding) })).filter(x => x.score >= 0).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.e);
  if (!dept.length) throw new Error("선택한 학과 자료가 없습니다. 관리자에게 학과 정보 등록을 요청해 주세요.");
  return scope === "department" ? dept : [...admission, ...dept, ...extras];
}
