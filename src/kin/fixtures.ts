import type { KnowledgeEntry, KinDraft, KinQuestion } from "./types";

/** Demo fixtures for admin UI stubs (no live API). */
export const FIXTURE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "kb-dept-nursing",
    category: "department",
    title: "간호학과 소개",
    body: "혜전대학교 간호학과는 임상 실습과 이론을 균형 있게 운영합니다. 상세 커리큘럼은 학과 홈페이지를 참고하세요.",
    revisionLabel: "2026",
    isActive: true,
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "kb-adm-2027",
    category: "admission",
    title: "2027학년도 수시 안내(요약)",
    body: "수시 모집 요강·전형 일정은 입학처 공지와 모집요강을 기준으로 합니다. 해전대(=혜전대)로 검색된 글에도 동일 안내를 적용합니다.",
    revisionLabel: "2027 입시",
    isActive: true,
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
];

export const FIXTURE_QUESTION: KinQuestion = {
  id: "kin-demo-1",
  naverUrl: "https://kin.naver.com/qna/detail.naver?d1id=0&dirId=0&docId=0",
  title: "해전대 간호학과 취업률이 궁금합니다",
  questionText:
    "해전대(혜전대) 간호학과 진학을 고민 중인데, 최근 취업·실습 관련 정보가 있을까요?",
  detectedAt: "2026-11-02T01:00:00.000Z",
  status: "drafted",
  matchedAliases: ["해전대", "혜전대"],
};

export const FIXTURE_DRAFT: KinDraft = {
  id: "draft-demo-1",
  questionId: "kin-demo-1",
  draftBody:
    "안녕하세요. 혜전대학교 관련 안내에 참고가 될 수 있는 내용입니다.\n\n【간호학과 소개】 (2026)\n혜전대학교 간호학과는 임상 실습과 이론을 균형 있게 운영합니다.\n\n※ 최신·정확한 내용은 hj.ac.kr 와 입학처 공지를 확인해 주세요.\n※ 자동 게시되지 않는 관리자 검토용 초안입니다.",
  sourceKnowledgeIds: ["kb-dept-nursing"],
  status: "pending_review",
  createdAt: "2026-11-02T01:05:00.000Z",
};
