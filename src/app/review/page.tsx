import { requireRole } from "../../auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canAccessQuestion } from "../../auth/scope";
import { listQuestions, getDraftForQuestion, listAssignees } from "../../db/store";
import { needsAnswerReview } from "../../kin/review-queue";

export const dynamic = "force-dynamic";

/**
 * Assignee Kin review inbox — separate from /admin.
 */
export default async function ReviewInboxPage() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const assignments = await listAssignees();
  const questions = (await listQuestions()).filter(q => canAccessQuestion(user, q, assignments) && needsAnswerReview(q.status));
  const rows = await Promise.all(
    questions.map(async (q) => ({
      q,
      draft: await getDraftForQuestion(q.id),
    })),
  );

  return (
    <>
      <p className="page-lead">
        <strong>지식인 검토</strong> — 질문을 확인하고 답변을 작성한 뒤 네이버에서 직접 게시합니다. 답변 여부는 담당자가 원문을 확인하고 표시합니다.
      </p>

      {!user ? (
        <section className="panel">
          <p>
            로그인이 필요합니다.{" "}
            <a href="/login">이메일 로그인</a> (개발: 담당자 세션 버튼 사용
            가능).
          </p>
        </section>
      ) : (
        <p className="muted">
          로그인: {user.email} ({user.role})
        </p>
      )}

      <section className="panel">
        <h2>답변 확인이 필요한 질문</h2>
        <p className="muted">답변 확인으로 표시한 질문은 이 목록에서 제외됩니다. 답변 여부를 아직 확인하지 않은 질문이 포함됩니다.</p>
        <p><Link href="/review/history">답변 기록 보기</Link></p>
        <table>
          <thead>
            <tr>
              <th>질문</th>
              <th>혜전대학교 답변</th>
              <th>저장 기록</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  확인이 필요한 질문이 없습니다. 관리자가 지식iN 감지를 실행하면 새 결과를 확인할 수 있습니다.
                </td>
              </tr>
            ) : (
              rows.map(({ q, draft }) => (
                <tr key={q.id}>
                  <td>{q.title}</td>
                  <td>
                    <span className="badge warn">{q.status === "manual_posted" ? "확인됨 (담당자 표시)" : "미확인"}</span>
                  </td>
                  <td className="muted">{draft ? "있음" : "없음"}</td>
                  <td>
                    <a href={`/review/${q.id}`}>답변 작성</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
