import { SEED_KEYWORDS } from "../../config/seeds";

export default function KeywordsPage() {
  return (
    <section className="panel">
      <h2>키워드 (시드 · CRUD API 초안)</h2>
      <p className="muted">
        MVP UI는 시드 목록을 표시합니다. DB 연결 후{" "}
        <code>GET /api/keywords</code> 로 실데이터를 읽습니다. 관리자 쓰기 API는
        <code>WEBSIGHT_ADMIN_TOKEN</code> 가드(초안).
      </p>
      <table>
        <thead>
          <tr>
            <th>구문</th>
            <th>brand</th>
            <th>match_mode</th>
          </tr>
        </thead>
        <tbody>
          {SEED_KEYWORDS.map((k) => (
            <tr key={k.phrase}>
              <td>{k.phrase}</td>
              <td>{String(k.is_brand)}</td>
              <td>
                <code>{k.match_mode}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
