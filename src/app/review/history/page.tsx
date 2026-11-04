import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "../../../auth/session";
import { canAccessQuestion } from "../../../auth/scope";
import { listAssignees, listDraftHistory, listQuestions } from "../../../db/store";
import { AnswerHistoryTable } from "../../../components/AnswerHistoryTable";
import { safeNaverQuestionUrl } from "../../../kin/question-link";

export const dynamic = "force-dynamic";
export default async function AnswerHistoryPage() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const [drafts, questions, assignments] = await Promise.all([listDraftHistory(), listQuestions(), listAssignees()]);
  const visible = new Map(questions.filter(q => canAccessQuestion(user, q, assignments)).map(q => [q.id, q]));
  const records = drafts.filter(d => (user.role === "admin" || !d.deletedAt) && (user.role === "admin" || visible.has(d.questionId) || d.savedBy?.toLowerCase() === user.email.toLowerCase())).map(d => ({ id: d.id, title: visible.get(d.questionId)?.title ?? "원본 질문 없음", questionUrl: safeNaverQuestionUrl(visible.get(d.questionId)?.naverUrl), reviewId: visible.has(d.questionId) ? d.questionId : undefined, body: d.draftBody, createdAt: d.createdAt, savedBy: d.savedBy, deletedAt: d.deletedAt }));
  return <>
    <p className="page-lead"><strong>답변 기록</strong> — 저장한 답변을 확인하는 곳입니다. 대학과 학과 정보가 변경될 수 있어 새로운 답변에는 기록을 자동으로 사용하지 않습니다.</p>
    <section className="panel"><h2>저장된 답변</h2><p className="muted">답변 내용을 클릭하면 전체 내용을 볼 수 있습니다. 삭제한 기록은 관리자가 복원할 수 있습니다.</p><p><Link href="/review">질문 목록으로 돌아가기</Link></p>
      <AnswerHistoryTable records={records} email={user.email} isAdmin={user.role === "admin"} />
    </section>
  </>;
}
