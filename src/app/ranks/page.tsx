export default function RanksPage() {
  return (
    <section className="panel">
      <h2>순위 테이블</h2>
      <p className="muted">
        DB 적용 후 <code>GET /api/ranks</code> 가{" "}
        <code>rank_snapshots</code> 파생 메타(학교 순위·도메인·URL·상태)를
        반환합니다. title/snippet 컬럼은 스키마에 없습니다.
      </p>
      <p className="muted">
        수동 수집: <code>POST /api/runs</code> (Admin 토큰) 또는{" "}
        <code>npx tsx src/jobs/collect-run.ts</code>
      </p>
      <table>
        <thead>
          <tr>
            <th>키워드</th>
            <th>엔진</th>
            <th>순위</th>
            <th>상태</th>
            <th>도메인</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className="muted">
              아직 스냅샷 없음 — DDL 적용·수집 후 API로 확인
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
