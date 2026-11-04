import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { KinDetectPanel } from "../../../components/KinDetectPanel";
import { listQuestions } from "../../../db/store";
import { needsAnswerReview } from "../../../kin/review-queue";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminKinListPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const items = (await listQuestions()).filter(q => needsAnswerReview(q.status));
  return (
    <>
      <p className="page-lead">
        네이버 지식iN에서 혜전대 관련 새 글을 감지한 목록입니다. 초안 생성 후
        관리자가 검토하며, <strong>답글 자동 게시는 없습니다</strong>.
      </p>

      <section className="panel">
        <h2>답변 확인이 필요한 질문</h2>
        <p className="muted">답변 확인으로 표시한 질문은 제외됩니다. <Link href="/review/history">답변 기록 보기</Link></p>
        <KinDetectPanel latestQuestionId={items[0]?.id} />
        <table>
          <thead>
            <tr>
              <th>제목</th>
              <th>상태</th>
              <th>감지</th>
              <th>검토</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  질문이 없습니다. 위 버튼으로 조회해 주세요.
                </td>
              </tr>
            ) : (
              items.map((q) => (
                <tr key={q.id}>
                  <td>{q.title}</td>
                  <td>
                    <span className="badge warn">{q.status}</span>
                  </td>
                  <td className="muted">
                    {new Date(q.detectedAt).toLocaleString("ko-KR")}
                  </td>
                  <td>
                    <a href={`/admin/kin/${q.id}`}>나란히 검토</a>
                    {" · "}
                    <a href={`/review/${q.id}`}>담당자 뷰</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
          수집기: <code>NaverKinDetector</code> (공식 kin.json). 게시 API 호출
          경로 없음.
        </p>
      </section>
    </>
  );
}
