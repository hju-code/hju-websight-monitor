import { requireRole } from "../../auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canAccessQuestion } from "../../auth/scope";
import { listQuestions, getDraftForQuestion, listAssignees, listReviewPeriods, getLastKinDetection } from "../../db/store";
import { DAILY_CRON, MANUAL_KIN_COOLDOWN_MINUTES } from "../../config/schedule";
import { needsAnswerReview } from "../../kin/review-queue";
import { KinDetectPanel } from "../../components/KinDetectPanel";
import { PageHeader } from "../../components/PageHeader";

export const dynamic = "force-dynamic";

/**
 * Assignee Kin review inbox — separate from /admin.
 */
export default async function ReviewInboxPage() {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const assignments = await listAssignees();
  const periods = await listReviewPeriods();
  const lastDetection = await getLastKinDetection();
  const questionDates = periods.map(p => p.questionDate).sort();
  const answerDates = periods.map(p => p.answerDate).sort();
  const questions = (await listQuestions()).filter(q => canAccessQuestion(user, q, assignments) && needsAnswerReview(q.status));
  const rows = await Promise.all(
    questions.map(async (q) => ({
      q,
      draft: await getDraftForQuestion(q.id),
    })),
  );

  const lastDetectionText = lastDetection ? new Date(lastDetection).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }) : "기록 없음";
  const drafted = rows.filter(r => r.draft).length;

  return (
    <>
      <PageHeader eyebrow="지식iN 검토" title="답변이 필요한 질문">질문을 확인하고 답변을 작성한 뒤 네이버에서 직접 게시합니다. 답변 여부는 담당자가 원문을 확인하고 표시합니다.</PageHeader>

      <section className="info-bar" aria-label="지식iN 질문 감지와 검토 기간">
        <div className="info-bar-row">
          <div className="info-bar-text">
            <strong>지식iN 질문 감지</strong>
            <span>자동 감지: {DAILY_CRON.label}쯤</span>
            <span>최종 감지: {lastDetectionText}</span>
          </div>
          <KinDetectPanel compact />
        </div>
        <div className="info-bar-row info-bar-sub">
          <div className="info-bar-text">
            <strong>검토 기간 참고</strong>
            {questionDates.length ? <><span>질문 작성일 {questionDates[0]} ~ {questionDates[questionDates.length - 1]}</span><span>답변 입력일 {answerDates[0]} ~ {answerDates[answerDates.length - 1]}</span></> : <span className="muted">기록 없음</span>}
          </div>
          <details className="info-bar-more">
            <summary>자세히</summary>
            <ul>
              <li>자동 감지는 1일 1회 실행되며, 수동 감지는 {MANUAL_KIN_COOLDOWN_MINUTES}분에 한 번 실행할 수 있습니다. 자동 감지는 서버 사정에 따라 몇 분 늦어질 수 있습니다.</li>
              <li>감지 실행 시 보관 기간(20일)이 지난 기록을 먼저 지우고, 활성 키워드로 네이버 지식iN 검색 API를 조회해 처음 보는 질문만 추가합니다. 키워드마다 최대 30건이며, 답변 확인이나 답변 필요없음으로 표시한 질문은 건너뜁니다.</li>
              <li>기존 질문의 상태와 저장한 답변은 바뀌지 않고, 네이버에 답변을 게시하지 않습니다. 목록에는 나에게 배정된 키워드의 질문만 표시됩니다.</li>
              <li>검토 기간은 담당자가 답변 확인 표시 때 입력한 날짜의 범위이며, 이 기간의 모든 질문을 확인했다는 뜻은 아닙니다. 질문일·답변일·서비스명만 계속 보관하고 질문 제목, 링크, 답변 내용은 포함하지 않습니다.</li>
            </ul>
          </details>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">확인이 필요한 질문</span><strong className="stat-value">{rows.length.toLocaleString("ko-KR")}<small>건</small></strong></div>
        <div className="stat-card"><span className="stat-label">저장 기록이 있는 질문</span><strong className="stat-value">{drafted.toLocaleString("ko-KR")}<small>건</small></strong></div>
      </div>

      <section className="panel">
        <div className="panel-heading"><h2>답변 확인이 필요한 질문</h2><Link href="/review/history" className="btn btn-ghost btn-sm">답변 기록 보기</Link></div>
        <p className="muted">답변 확인이나 답변 필요없음으로 표시한 질문은 이 목록에서 빠집니다.</p>
        <div className="table-scroll"><table className="list-table">
          <thead>
            <tr>
              <th>질문</th>
              <th>감지 일시</th>
              <th>혜전대학교 답변</th>
              <th>저장 기록</th>
              <th><span className="visually-hidden">작업</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  확인이 필요한 질문이 없습니다. 위의 지금 감지 버튼으로 새 질문을 찾을 수 있습니다.
                </td>
              </tr>
            ) : (
              rows.map(({ q, draft }) => (
                <tr key={q.id}>
                  <td className="cell-title"><Link href={`/review/${q.id}`}>{q.title}</Link></td>
                  <td className="cell-date">{new Date(q.detectedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" })}</td>
                  <td><span className="badge warn">{q.status === "manual_posted" ? "확인됨" : "미확인"}</span></td>
                  <td>{draft ? <span className="badge ok">있음</span> : <span className="muted">없음</span>}</td>
                  <td className="cell-action"><Link href={`/review/${q.id}`} className="btn btn-secondary btn-sm">답변 작성</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </section>

    </>
  );
}
