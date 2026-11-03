import { KinDetectPanel } from "../../../components/KinDetectPanel";
import { listQuestions } from "../../../db/store";

export const dynamic = "force-dynamic";

export default async function AdminKinListPage() {
  const items = await listQuestions();
  return (
    <>
      <p className="page-lead">
        네이버 지식iN에서 혜전대 관련 새 글을 감지한 목록입니다. 초안 생성 후
        관리자가 검토하며, <strong>답글 자동 게시는 없습니다</strong>.
      </p>

      <section className="panel">
        <h2>감지 · 초안</h2>
        <KinDetectPanel />
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
                  없음 — 위 버튼으로 감지(스텁 또는 실API)
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
