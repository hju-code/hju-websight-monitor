import { isSafeMutation } from "../../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../auth/session";
import { canAccessQuestion } from "../../../../auth/scope";
import { getDraftById, getDraftForQuestion, getQuestion, listAssignees, listKnowledge, saveDraftBody, setManualAnswerStatus, updateDraftStatus } from "../../../../db/store";
import { aiConfig, detectDepartment, draftFromKnowledge } from "../../../../kin/ai";
import type { AnswerKnowledge } from "../../../../kin/retrieval";
import type { DraftStatus } from "../../../../kin/types";
import type { WebSightUser } from "../../../../auth/types";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
async function permitted(user: WebSightUser, questionId: string): Promise<boolean> {
  const question = await getQuestion(questionId);
  return !!question && canAccessQuestion(user, question, await listAssignees());
}
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const user = await requireRole(["admin", "assignee"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "unsupported" }, { status: 415 });
  const body = await req.json().catch(() => null) as { action?: string; questionId?: string; draftId?: string; body?: string; note?: string; topic?: string; department?: unknown; scope?: unknown } | null;
  if (!body) return NextResponse.json({ error: "invalid request" }, { status: 400 });
  let questionId = typeof body.questionId === "string" ? body.questionId : undefined;
  if (body.draftId) questionId = (await getDraftById(body.draftId))?.questionId;
  if (!questionId || !(await permitted(user, questionId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (body.action === "mark_answered" || body.action === "clear_answered") {
    const ok = await setManualAnswerStatus(questionId, body.action === "mark_answered");
    return NextResponse.json({ ok });
  }
  if (body.action === "ai_generate") {
    if (typeof body.topic !== "string" || !body.topic.trim() || body.topic.length > 4000) return NextResponse.json({ error: "질문을 4,000자 이내로 입력해 주세요." }, { status: 400 });
    if (!["auto", "university", "department", "both"].includes(String(body.scope)) || (body.department !== undefined && (typeof body.department !== "string" || body.department.length > 100)) || (body.body !== undefined && (typeof body.body !== "string" || body.body.length > 20000))) return NextResponse.json({ error: "답변 범위를 확인해 주세요." }, { status: 400 });
    try {
      const model = aiConfig().embeddingModel;
      const knowledge = (await listKnowledge()).filter(k => k.isActive && k.embeddingModel === model);
      const departments = [...new Set(knowledge.filter(k => k.category === "department" && k.departmentName && k.summary && k.embedding?.length).map(k => k.departmentName!))];
      let department = typeof body.department === "string" ? body.department.trim() : "";
      let scope = body.scope as "auto" | "university" | "department" | "both";
      if (scope === "auto") {
        const detected = await detectDepartment(body.topic.trim(), departments);
        if (detected.needsDepartment && !detected.department) return NextResponse.json({ error: "질문에 해당하는 학과 자료를 찾지 못했습니다. 관리자에게 학과 정보 등록을 요청해 주세요." }, { status: 400 });
        department = detected.department;
        scope = department ? "both" : "university";
      }
      if ((scope === "department" || scope === "both") && !departments.includes(department)) return NextResponse.json({ error: "답변할 학과를 선택해 주세요." }, { status: 400 });
      if (scope !== "department" && !knowledge.some(k => k.category === "admission" && k.sourceFileName && k.sections?.length)) return NextResponse.json({ error: "사용 가능한 모집요강 PDF가 없습니다. 관리자에게 등록을 요청해 주세요." }, { status: 400 });
      const entries: AnswerKnowledge[] = knowledge.flatMap<AnswerKnowledge>(k => {
        if (k.category === "admission" && k.sourceFileName && k.sections?.length) return k.sections.map(section => ({ title: k.title, summary: section.text, embedding: section.embedding, kind: "admission" as const }));
        if (k.category === "department" && k.departmentName === department && k.summary && k.embedding?.length) return [{ title: k.title, summary: k.summary, embedding: k.embedding, kind: "department" as const, departmentName: k.departmentName }];
        if (k.category !== "department" && !k.sourceFileName && k.summary && k.embedding?.length) return [{ title: k.title, summary: k.summary, embedding: k.embedding, kind: "extra" as const }];
        return [];
      });
      const result = await draftFromKnowledge(body.topic.trim(), entries, department, scope, typeof body.body === "string" ? body.body.trim() : "");
      return NextResponse.json({ ok: true, answer: result.answer });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "초안을 생성하지 못했습니다." }, { status: 503 }); }
  }
  if (body.action === "save" && typeof body.body === "string") {
    try { const draft = await saveDraftBody(questionId, body.body, user.email); return NextResponse.json({ ok: true, draft }); }
    catch { return NextResponse.json({ error: "답변 내용을 확인해 주세요." }, { status: 400 }); }
  }
  const statuses: Record<string, DraftStatus> = { approve: "approved", reject: "rejected", copied_for_manual_post: "copied_for_manual_post" };
  const status = statuses[body.action ?? ""];
  if (!status || !body.draftId) return NextResponse.json({ error: "invalid action" }, { status: 400 });
  const draft = await updateDraftStatus(body.draftId, status, body.note);
  return NextResponse.json({ ok: !!draft, draft, autoPostEnabled: false });
}
export async function GET(req: NextRequest) {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const qid = req.nextUrl.searchParams.get("questionId");
  if (!qid || !(await permitted(user, qid))) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ autoPostEnabled: false, draft: await getDraftForQuestion(qid) });
}
