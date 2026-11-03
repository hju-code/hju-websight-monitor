import { getPublicStats } from "../../db/live-stats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Public statistics — no login.
 * On Vercel without durable PG: auto live-fetch Naver when only samples exist.
 */
export default async function PublicStatsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const liveParam = sp.live;
  const forceLive =
    liveParam === "1" ||
    liveParam === "true" ||
    (Array.isArray(liveParam) && liveParam.includes("1"));

  const summary = await getPublicStats({
    forceLive,
    keywords: ["혜전대학교"],
  });
  const isLive = summary.mode === "fresh_live" || summary.mode === "stored_live";

  return (
    <>
      <p className="page-lead">
        <strong>혜전대학교</strong> 웹 노출 통계 (공개). 검색 이명 「해전대」는
        혜전대로만 취급합니다.
      </p>

      <section className="panel">
        <h2>검색 순위 요약</h2>
        <p className="muted">
          활성 플랫폼:{" "}
          <code>{summary.enabledPlatforms.join(", ") || "(없음)"}</code>
          {" · "}
          모드 <code>{summary.mode}</code>
          {" · "}
          스냅샷 {summary.totalSnapshots}건
          {isLive ? ` · live ${summary.liveCount}` : ""}
          {summary.sampleCount > 0 && !isLive
            ? " (샘플/드라이런 포함 — UX 완성용)"
            : ""}
        </p>
        {summary.note ? <p className="muted">{summary.note}</p> : null}
        <table>
          <thead>
            <tr>
              <th>키워드</th>
              <th>사이트</th>
              <th>최근 순위</th>
              <th>상태</th>
              <th>도메인</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  아직 집계가 없습니다. 관리자 수집 또는 샘플 시드를 확인하세요.
                </td>
              </tr>
            ) : (
              summary.rows.map((r) => (
                <tr key={`${r.phrase}-${r.engine}-${r.tab}-${r.id}`}>
                  <td>{r.phrase}</td>
                  <td>
                    {r.engine} / {r.tab}
                  </td>
                  <td>
                    {r.schoolRank != null ? (
                      <strong>{r.schoolRank}</strong>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.schoolStatus === "ok" ? "ok" : "warn"
                      }`}
                    >
                      {r.schoolStatus}
                    </span>
                    {r.source === "sample" ? (
                      <>
                        {" "}
                        <span className="badge">sample</span>
                      </>
                    ) : null}
                    {r.source === "live" ? (
                      <>
                        {" "}
                        <span className="badge ok">live</span>
                      </>
                    ) : null}
                  </td>
                  <td className="muted mono">{r.matchedDomain ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>안내</h2>
        <ul className="checklist">
          <li>원문(title/snippet)은 저장하지 않으며 파생 순위만 표시합니다.</li>
          <li>
            Vercel 파일 스토어는 <code>/tmp</code> (인스턴스 휘발) — 내구성은 PG/KV
            권장. 샘플만 있으면 공개 통계가 Naver를 즉시 조회합니다.
          </li>
          <li>Google 채널은 보류 상태입니다.</li>
          <li>
            지식iN 답변 검토는 공개되지 않습니다 → <a href="/review">검토 로그인</a>
          </li>
          <li>
            강제 재조회: <a href="/stats?live=1">/stats?live=1</a> ·{" "}
            <a href="/api/ranks?live=1&amp;q=혜전대학교">/api/ranks?live=1</a>
          </li>
        </ul>
      </section>
    </>
  );
}
