import { requireRole } from "../../auth/session";
import { CollectButton } from "../../components/CollectButton";
import { MANUAL_COLLECT_COOLDOWN_MINUTES, WEEKLY_CRON } from "../../config/schedule";
import { getLastRankCollection } from "../../db/store";

/** Schedule and last-run summary for keyword search collection; signed-in staff can also run it now. */
export async function CollectionBar() {
  const [user, last] = await Promise.all([requireRole(["admin", "assignee"]), getLastRankCollection().catch(() => undefined)]);
  const lastText = last ? new Date(last).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }) : "기록 없음";
  return <section className="info-bar" aria-label="키워드 검색 수집">
    <div className="info-bar-row">
      <div className="info-bar-text">
        <strong>키워드 검색 수집</strong>
        <span>자동 수집: {WEEKLY_CRON.label}쯤</span>
        <span>최종 수집: {lastText}</span>
      </div>
      {user && <CollectButton compact />}
    </div>
    {user && <div className="info-bar-row info-bar-sub">
      <details className="info-bar-more">
        <summary>자세히</summary>
        <ul>
          <li>자동 수집은 1주일에 1회 실행되며, 수동 수집은 {MANUAL_COLLECT_COOLDOWN_MINUTES}분에 한 번 실행할 수 있습니다. 자동 수집은 서버 사정에 따라 몇 분 늦어질 수 있습니다.</li>
          <li>관리자가 등록한 활성 키워드를 관리자 설정에서 선택한 검색 사이트에서 조회해 혜전대학교 순위와 검색결과 건수를 저장합니다. 검색 결과의 제목과 내용은 저장하지 않습니다.</li>
          <li>다른 수집이 실행 중이면 끝난 뒤 다시 시도해 주세요. 수집에는 몇 초에서 1분 정도 걸릴 수 있습니다.</li>
        </ul>
      </details>
    </div>}
  </section>;
}
