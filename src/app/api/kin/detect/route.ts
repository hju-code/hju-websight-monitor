import { detectionOutcome } from "../../../../collectors/detection-outcome";
import { isSafeMutation } from "../../../../auth/csrf";
import { requireRole } from "../../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { canAccessQuestion } from "../../../../auth/scope";
import { NaverKinDetector } from "../../../../collectors/naver-kin";
import { collectUnconfirmedQuestions } from "../../../../collectors/kin-detection-pages";

import {
  listQuestions,
  listAssignees,
  listKeywordsFromStore,
  upsertQuestions,
} from "../../../../db/store";
import type { KinQuestion } from "../../../../kin/types";

export const dynamic = "force-dynamic";

function stubQuestions(): KinQuestion[] {
  const now = new Date().toISOString();
  return [
    {
      id: `kin-stub-${Date.now()}`,
      naverUrl: "https://kin.naver.com/qna/detail.naver?d1id=11&dirId=1108&docId=stub",
      title: "혜전대 수시 전형 일정이 궁금해요",
      questionText:
        "해전대(=혜전대) 2027 수시 원서 접수 기간과 간호학과 모집 요강이 어디에 있나요?",
      detectedAt: now,
      status: "new",
      matchedAliases: ["해전대", "혜전대"],
    },
  ];
}

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

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const detector = new NaverKinDetector();
  let detected: KinQuestion[] = [];
  let mode: "live" | "stub" = "stub";
  let failures = 0; let attempts = 0;

  const hasKeys =
    Boolean(process.env.NAVER_CLIENT_ID) &&
    Boolean(process.env.NAVER_CLIENT_SECRET);

  if (hasKeys) {
    mode = "live";
    const keywords = (await listKeywordsFromStore()).filter(k => k.is_active).map(k => k.phrase);
    const result = await collectUnconfirmedQuestions(keywords, await listQuestions(), (keyword, start, size) =>
      detector.collect({
        keyword,
        engine: "naver",
        tab: "kin",
        device: "desktop",
        scanDepth: size,
        start,
        retainRaw: "none",
      }));
    detected = result.questions;
    failures = result.failures;
    attempts = result.attempts;
  } else {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "네이버 API 설정이 필요합니다." }, { status: 503 });
    attempts = 1;
    detected = stubQuestions().map(q => ({ ...q, matchedKeywords: ["혜전대학교", "혜전대"] }));
  }

  const outcome = detectionOutcome(failures, attempts);
  if (!outcome.ok) return NextResponse.json({ ok: false, error: "질문을 조회하지 못했습니다. 검색 API와 활성 키워드를 확인해 주세요." }, { status: 503 });
  const added = await upsertQuestions(detected);
  const questions = await listQuestions();

  return NextResponse.json({
    ok: true,
    autoPostEnabled: false,
    mode,
    partial: outcome.partial,
    failures,
    detected: detected.length,
    added,
    questions: questions.slice(0, 20),
    note:
      mode === "stub"
        ? "NAVER_* 미설정 — 스텁 질문 추가. 실API는 키 설정 후 동일 엔드포인트."
        : "네이버 지식iN 검색 API 결과 반영. 자동 게시 없음.",
  });
}
