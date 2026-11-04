import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "../../../auth/session";
import { canAccessQuestion } from "../../../auth/scope";
import { listAssignees, listDraftHistory, listQuestions } from "../../../db/store";

export const dynamic = "force-dynamic";
export default async function AnswerHistoryPage() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const [drafts, questions, assignments] = await Promise.all([listDraftHistory(), listQuestions(), listAssignees()]);
  const visible = new Map(questions.filter(q => canAccessQuestion(user, q, assignments)).map(q => [q.id, q]));
  const records = drafts.filter(d => visible.has(d.questionId));
  return <>
    <p className="page-lead"><strong>답변 기록</strong> — 저장한 답변을 확인하는 곳입니다. 대학과 학과 정보가 변경될 수 있어 새로운 답변에는 기록을 자동으로 사용하지 않습니다.</p>
    <section className="panel"><h2>저장된 답변</h2><p><Link href="/review">질문 목록으로 돌아가기</Link></p>
      {records.length === 0 ? <p className="muted">저장된 답변이 없습니다.</p> : <div className="knowledge-list">{records.map(record => <article className="knowledge-item" key={record.id}>
        <h3>{visible.get(record.questionId)?.title}</h3>
        <p className="muted">저장: {new Date(record.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}{record.savedBy ? ` · ${record.savedBy}` : " · 작성자 기록 없음"}</p>
        <details><summary>답변 내용 보기</summary><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{record.draftBody}</p></details>
      </article>)}</div>}
    </section>
  </>;
}
