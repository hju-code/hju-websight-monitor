import { getCurrentUser } from "../../auth/session";
import { listQuestions, getDraftForQuestion } from "../../db/store";

export const dynamic = "force-dynamic";

/**
 * Assignee Kin review inbox — separate from /admin.
 */
export default async function ReviewInboxPage() {
  const user = await getCurrentUser();
  const questions = await listQuestions();
  const rows = await Promise.all(
    questions.map(async (q) => ({
      q,
      draft: await getDraftForQuestion(q.id),
    })),
  );

  return (
    <>
      <p className="page-lead">
        <strong>지식인 검토</strong> — 관리자가 등록한 담당자 이메일로{" "}
        <a href="/login">로그인</a>한 뒤 이용합니다. 키워드·사이트·전체 설정(
        <a href="/admin">관리자</a>)과 <em>별개 영역</em>입니다. 대상 학교명은
        <strong>혜전대학교</strong>(이명 해전대)입니다.{" "}
        <strong>답글 자동 게시 없음.</strong>
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
        <h2>검토 대기</h2>
        <table>
          <thead>
            <tr>
              <th>질문</th>
              <th>상태</th>
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
                    <span className="badge warn">{q.status}</span>
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
