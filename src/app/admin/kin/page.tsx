import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { KinDetectPanel } from "../../../components/KinDetectPanel";
import { getLastKinDetection, listQuestions } from "../../../db/store";
import { DAILY_CRON } from "../../../config/schedule";
import { needsAnswerReview } from "../../../kin/review-queue";
import Link from "next/link";
import { PageHeader } from "../../../components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminKinListPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const items = (await listQuestions()).filter(q => needsAnswerReview(q.status));
  const lastDetection = await getLastKinDetection();
  return (
    <>
      <PageHeader eyebrow="관리" title="지식iN 감지">네이버 지식iN에서 혜전대 관련 질문을 감지한 전체 목록입니다. 답글은 자동으로 게시하지 않습니다.</PageHeader>

      <section className="panel">
        <h2>답변 확인이 필요한 질문</h2>
        <p className="muted">검색어별로 답변 확인 표시가 없는 질문을 최대 30건 찾습니다. 실제 답변 여부는 네이버 원문에서 확인해 주세요. <Link href="/review/history">답변 기록 보기</Link></p>
        <p>자동 감지: {DAILY_CRON.label}(한국 시간)쯤 · 최종 감지: {lastDetection ? new Date(lastDetection).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }) : "기록 없음"}</p>
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
