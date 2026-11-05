import { isSafeMutation } from "../../../../auth/csrf";
import { requireRole } from "../../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { canAccessQuestion } from "../../../../auth/scope";
import { listQuestions, listAssignees } from "../../../../db/store";
import { runKinDetection } from "../../../../jobs/kin-detect";
import { MANUAL_KIN_COOLDOWN_MINUTES } from "../../../../config/schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * List / trigger Kin detection. Never publishes answers to Naver.
 */
export async function GET() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const assignments = await listAssignees();
  const questions = (await listQuestions()).filter(q => canAccessQuestion(user, q, assignments));
  return NextResponse.json({
    autoPostEnabled: false,
    questions,
    note: "배정된 질문을 표시합니다.",
  });
}

/** Admins and assignees may run detection on demand; results stay scoped by assignment when listed. */
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin", "assignee"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runKinDetection({ allowStub: true, cooldownMinutes: MANUAL_KIN_COOLDOWN_MINUTES });
  if (!result.ok) {
    if (result.reason === "cooldown") return NextResponse.json({ ok: false, error: `최근 감지 결과가 있습니다. ${result.retryAfterMinutes}분 후 다시 시도해 주세요.` }, { status: 429, headers: { "retry-after": String(result.retryAfterMinutes * 60) } });
    if (result.reason === "busy") return NextResponse.json({ ok: false, error: "다른 감지가 실행 중입니다. 잠시 후 다시 시도해 주세요." }, { status: 409 });
    return result.reason === "not_configured"
      ? NextResponse.json({ ok: false, error: "네이버 API 설정이 필요합니다." }, { status: 503 })
      : NextResponse.json({ ok: false, error: "질문을 조회하지 못했습니다. 검색 API와 활성 키워드를 확인해 주세요." }, { status: 503 });
  }
  return NextResponse.json({
    ...result,
    autoPostEnabled: false,
    note:
      result.mode === "stub"
        ? "NAVER_* 미설정 — 스텁 질문 추가. 실API는 키 설정 후 동일 엔드포인트."
        : "네이버 지식iN 검색 API 결과 반영. 자동 게시 없음.",
  });
}
