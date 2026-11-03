import { NextResponse } from "next/server";
import { NaverKinDetector, hitsToKinQuestions } from "../../../../collectors/naver-kin";
import { SEED_KEYWORDS } from "../../../../config/seeds";
import {
  listQuestions,
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
  const questions = await listQuestions();
  return NextResponse.json({
    autoPostEnabled: false,
    questions,
    note: "Live detect via POST when NAVER_* keys set; otherwise stub append",
  });
}

export async function POST() {
  const detector = new NaverKinDetector();
  let detected: KinQuestion[] = [];
  let mode: "live" | "stub" = "stub";

  const hasKeys =
    Boolean(process.env.NAVER_CLIENT_ID) &&
    Boolean(process.env.NAVER_CLIENT_SECRET);

  if (hasKeys) {
    mode = "live";
    for (const kw of SEED_KEYWORDS) {
      const result = await detector.collect({
        keyword: kw.phrase,
        engine: "naver",
        tab: "kin",
        device: "desktop",
        scanDepth: 30,
        retainRaw: "none",
      });
      if (result.ok) {
        detected.push(...hitsToKinQuestions(result.hits));
        result.hits.length = 0;
      }
    }
  } else {
    detected = stubQuestions();
  }

  const added = await upsertQuestions(detected);
  const questions = await listQuestions();

  return NextResponse.json({
    ok: true,
    autoPostEnabled: false,
    mode,
    detected: detected.length,
    added,
    questions: questions.slice(0, 20),
    note:
      mode === "stub"
        ? "NAVER_* 미설정 — 스텁 질문 추가. 실API는 키 설정 후 동일 엔드포인트."
        : "네이버 지식iN 검색 API 결과 반영. 자동 게시 없음.",
  });
}
