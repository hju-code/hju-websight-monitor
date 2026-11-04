import { isSafeMutation } from "../../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../auth/session";
import { canAccessQuestion } from "../../../../auth/scope";
import { generateAndStoreDraft, getDraftById, getDraftForQuestion, getQuestion, listAssignees, saveDraftBody, updateDraftStatus } from "../../../../db/store";
import type { DraftStatus } from "../../../../kin/types";
import type { WebSightUser } from "../../../../auth/types";
export const dynamic = "force-dynamic";
async function permitted(user: WebSightUser, questionId: string): Promise<boolean> {
  const question = await getQuestion(questionId);
  return !!question && canAccessQuestion(user, question, await listAssignees());
}
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const user = await requireRole(["admin", "assignee"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "unsupported" }, { status: 415 });
  const body = await req.json().catch(() => null) as { action?: string; questionId?: string; draftId?: string; body?: string; note?: string } | null;
  if (!body) return NextResponse.json({ error: "invalid request" }, { status: 400 });
  let questionId = typeof body.questionId === "string" ? body.questionId : undefined;
  if (body.draftId) questionId = (await getDraftById(body.draftId))?.questionId;
  if (!questionId || !(await permitted(user, questionId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (body.action === "generate") return NextResponse.json({ ...(await generateAndStoreDraft(questionId)), autoPostEnabled: false });
  if (body.action === "save" && typeof body.body === "string") {
    try { const draft = await saveDraftBody(questionId, body.body); return NextResponse.json({ ok: true, draft }); }
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
