import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "../../../auth/session";
import { canAccessQuestion } from "../../../auth/scope";
import { listAssignees, listDraftHistory, listQuestions } from "../../../db/store";
import { AnswerHistoryTable } from "../../../components/AnswerHistoryTable";
import { safeNaverQuestionUrl } from "../../../kin/question-link";
import { NotNeededHistory } from "../../../components/NotNeededHistory";

export const dynamic = "force-dynamic";
export default async function AnswerHistoryPage() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const [drafts, questions, assignments] = await Promise.all([listDraftHistory(), listQuestions(), listAssignees()]);
  const visible = new Map(questions.filter(q => canAccessQuestion(user, q, assignments)).map(q => [q.id, q]));
  const records = drafts.filter(d => (user.role === "admin" || !d.deletedAt) && (user.role === "admin" || visible.has(d.questionId) || d.savedBy?.toLowerCase() === user.email.toLowerCase())).map(d => ({ id: d.id, title: visible.get(d.questionId)?.title ?? "원본 질문 없음", questionUrl: safeNaverQuestionUrl(visible.get(d.questionId)?.naverUrl), questionDate: visible.get(d.questionId)?.questionDate, reviewId: visible.has(d.questionId) ? d.questionId : undefined, body: d.draftBody, createdAt: d.createdAt, savedBy: d.savedBy, deletedAt: d.deletedAt }));
  const skipped = [...visible.values()].filter(q => q.status === "dismissed").map(q => ({ id: q.id, title: q.title, markedAt: q.dismissedAt, markedBy: q.dismissedBy }));
  return <>
    <p className="page-lead"><strong>답변 기록</strong> — 저장한 답변을 확인하는 곳입니다. 대학과 학과 정보가 변경될 수 있어 새로운 답변에는 기록을 자동으로 사용하지 않습니다.</p>
    <aside role="note" style={{ color: "#991b1b", border: "1px solid #dc2626", background: "#fff1f2", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1rem" }}><strong>네이버 검색 API 이용 안내</strong><p>검색 결과와 그 가공·파생물은 허용된 목적에서만 임시 보관할 수 있습니다. 이력 조회 목적의 서버 보관은 최대 21일입니다. <a href="https://www.ncloud.com/support/notice/all/2243" target="_blank" rel="noopener noreferrer">네이버 약관 안내 보기 ↗</a></p><p>기한을 넘기지 않도록 질문 감지 후 20일이 지난 질문과 연결된 답변 기록, 답변 필요없음 표시를 매일 자동 삭제합니다. 답변 내용도 삭제되며 복원할 수 없습니다. 삭제 후에는 같은 질문이 다시 나타날 수 있습니다.</p></aside>
    <section className="panel"><h2>저장된 답변</h2><p className="muted">답변 내용을 클릭하면 전체 내용을 볼 수 있습니다. 삭제한 기록은 관리자가 복원할 수 있습니다.</p><p><Link href="/review">질문 목록으로 돌아가기</Link></p>
      <AnswerHistoryTable records={records} email={user.email} isAdmin={user.role === "admin"} />
    </section>
    <NotNeededHistory rows={skipped} />
  </>;
}
