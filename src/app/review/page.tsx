import { requireRole } from "../../auth/session";
import { redirect } from "next/navigation";
import { canAccessQuestion } from "../../auth/scope";
import { listQuestions, getDraftForQuestion, listAssignees } from "../../db/store";

export const dynamic = "force-dynamic";

/**
 * Assignee Kin review inbox — separate from /admin.
 */
export default async function ReviewInboxPage() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const assignments = await listAssignees();
  const questions = (await listQuestions()).filter(q => canAccessQuestion(user, q, assignments)).sort((a, b) => Number(a.status === "manual_posted") - Number(b.status === "manual_posted"));
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
        <h2>질문 목록</h2>
        <table>
          <thead>
            <tr>
              <th>질문</th>
              <th>혜전대학교 답변</th>
              <th>초안</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  감지된 질문 없음 — 관리자에서 감지 실행
                </td>
              </tr>
            ) : (
              rows.map(({ q, draft }) => (
                <tr key={q.id}>
                  <td>{q.title}</td>
                  <td>
                    <span className="badge warn">{q.status === "manual_posted" ? "확인됨 (담당자 표시)" : "미확인"}</span>
                  </td>
                  <td className="muted">{draft ? draft.status : "없음"}</td>
                  <td>
                    <a href={`/review/${q.id}`}>나란히 검토</a>
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
