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

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">확인이 필요한 질문</span><strong className="stat-value">{rows.length.toLocaleString("ko-KR")}<small>건</small></strong></div>
        <div className="stat-card"><span className="stat-label">저장 기록이 있는 질문</span><strong className="stat-value">{drafted.toLocaleString("ko-KR")}<small>건</small></strong></div>
        <div className="stat-card"><span className="stat-label">최종 감지</span><strong className="stat-value stat-value-text">{lastDetectionText}</strong></div>
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
                  확인이 필요한 질문이 없습니다. 아래 지식iN 감지 실행 버튼으로 새 질문을 찾을 수 있습니다.
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

      <div className="panel-grid">
        <section className="panel">
          <h2>지식iN 질문 감지</h2>
          <p>자동 감지: {DAILY_CRON.label}(한국 시간)쯤 · 최종 감지: {lastDetectionText}</p>
          <p className="muted">자동 감지는 서버 사정에 따라 몇 분 늦어질 수 있습니다. 새 질문을 바로 확인하려면 수동 감지를 실행해 주세요.</p>
          <KinDetectPanel latestQuestionId={rows[0]?.q.id} answerBase="/review" />
          <details className="disclosure">
            <summary>버튼을 누르면 일어나는 일</summary>
            <ol>
              <li>보관 기간(20일)이 지난 질문과 답변 기록을 먼저 삭제합니다.</li>
              <li>관리자가 등록한 활성 검색 키워드로 네이버 지식iN 검색 API를 조회합니다. 답변 확인이나 답변 필요없음으로 표시한 질문은 건너뛰고, 키워드마다 확인이 필요한 질문을 최대 30건 찾습니다.</li>
              <li>처음 보는 질문만 목록에 추가합니다. 이미 있는 질문의 상태와 저장한 답변은 바뀌지 않습니다.</li>
              <li>감지는 모든 키워드를 대상으로 하지만, 이 목록에는 나에게 배정된 키워드의 질문만 표시됩니다.</li>
              <li>네이버에 답변을 게시하지 않습니다. 질문을 읽기만 하며, 몇 초에서 1분 정도 걸릴 수 있습니다.</li>
              <li>자동 감지는 1일 1회 실행되며, 수동 감지는 {MANUAL_KIN_COOLDOWN_MINUTES}분에 한 번 실행할 수 있습니다.</li>
            </ol>
          </details>
        </section>

        <section className="panel"><h2>검토 기간 참고</h2>{questionDates.length ? <><dl className="meta-list"><div><dt>질문 작성일</dt><dd>{questionDates[0]} ~ {questionDates[questionDates.length - 1]}</dd></div><div><dt>답변 입력일</dt><dd>{answerDates[0]} ~ {answerDates[answerDates.length - 1]}</dd></div></dl><p className="muted">네이버 지식iN · 담당자가 입력한 날짜의 범위입니다. 이 기간의 모든 질문을 확인했거나 답변했다는 뜻은 아닙니다.</p></> : <p className="muted">아직 기록된 기간이 없습니다. 답변 확인 표시 시 질문 작성일과 답변 입력일을 입력해 주세요.</p>}<p className="muted">질문일·답변일·서비스명은 별도로 계속 보관합니다. 질문 제목, 링크, 답변 내용은 포함하지 않습니다.</p></section>
      </div>
    </>
  );
}
