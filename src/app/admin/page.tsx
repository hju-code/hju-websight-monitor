/**
 * Admin hub — keywords, sites/settings, assignees, knowledge.
 * Separate from public /stats and assignee /review.
 */
export default function AdminHomePage() {
  return (
    <>
      <p className="page-lead">
        <strong>관리자</strong> — 검색 키워드·전체 설정·담당자 이메일·학과/입시
        지식. 공개 통계(<a href="/stats">/stats</a>)·지식인 검토(
        <a href="/review">/review</a>)와 영역이 분리되어 있습니다. 학교명:{" "}
        <strong>혜전대학교</strong> (이명: 해전대=혜전대).
      </p>

      <section className="panel">
        <h2>관리 메뉴</h2>
        <ul className="checklist">
          <li>
            <a href="/admin/keywords">검색 키워드 관리</a>
          </li>
          <li>
            <a href="/admin/settings">전체 설정 관리</a> — 소셜·검색 플랫폼
            체크박스 (체크분만 수집)
          </li>
          <li>
            <a href="/admin/assignees">사이트/키워드별 담당자·이메일</a>
          </li>
          <li>
            <a href="/admin/knowledge">학과·입시 정보</a>
          </li>
          <li>
            <a href="/admin/kin">지식iN 감지 목록 (관리자 보기)</a>
          </li>
        </ul>
        <p className="muted notice-nopost" style={{ marginBottom: 0 }}>
          지식iN 답글 자동 게시 설정은 잠금(false)입니다.
        </p>
      </section>
    </>
  );
}
