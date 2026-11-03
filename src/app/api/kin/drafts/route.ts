import { NextRequest, NextResponse } from "next/server";
import { isAutoPostAllowed } from "../../../../kin/draft";
import {
  generateAndStoreDraft,
  getDraftForQuestion,
  listQuestions,
  updateDraftStatus,
} from "../../../../db/store";
import type { DraftStatus } from "../../../../kin/types";

export const dynamic = "force-dynamic";

/** Generate draft from knowledge — review only, no Naver publish. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    questionId?: string;
    action?: "generate" | "approve" | "reject" | "copied_for_manual_post";
    draftId?: string;
    note?: string;
  };

  const action = body.action ?? "generate";

  if (action === "generate") {
    let questionId = body.questionId;
    if (!questionId) {
      const qs = await listQuestions();
      questionId = qs[0]?.id;
    }
    if (!questionId) {
      return NextResponse.json(
        {
          ok: false,
          errorMessage: "no question — run POST /api/kin/detect first",
          autoPostEnabled: false,
        },
        { status: 400 },
      );
    }
    const result = await generateAndStoreDraft(questionId);
    return NextResponse.json({
      ...result,
      autoPostEnabled: isAutoPostAllowed(),
    });
  }

  if (!body.draftId) {
    return NextResponse.json(
      { ok: false, error: "draftId required", autoPostEnabled: false },
      { status: 400 },
    );
  }

  const statusMap: Record<string, DraftStatus> = {
    approve: "approved",
    reject: "rejected",
    copied_for_manual_post: "copied_for_manual_post",
  };
  const status = statusMap[action];
  if (!status) {
    return NextResponse.json(
      { ok: false, error: "unknown action", autoPostEnabled: false },
      { status: 400 },
    );
  }

  const updated = await updateDraftStatus(body.draftId, status, body.note);
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "draft not found", autoPostEnabled: false },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    draft: updated,
    autoPostEnabled: false,
    note:
      status === "copied_for_manual_post"
        ? "수동 붙여넣기 표시만 저장 — 네이버 API 게시 없음"
        : "상태만 저장. 자동 게시 없음.",
  });
}

export async function GET(req: NextRequest) {
  const qid = req.nextUrl.searchParams.get("questionId");
  if (qid) {
    const draft = await getDraftForQuestion(qid);
    return NextResponse.json({ autoPostEnabled: false, draft });
  }
  return NextResponse.json({
    autoPostEnabled: false,
    message:
      "POST { questionId } to generate; POST { action, draftId } to approve/reject/copied_for_manual_post",
  });
}
