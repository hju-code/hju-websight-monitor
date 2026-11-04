import { CollectButton } from "../../components/CollectButton";
import Link from "next/link";
import { requireRole } from "../../auth/session";
import { redirect } from "next/navigation";
/**
 * Admin hub — keywords, sites/settings, assignees, knowledge.
 * Separate from public /stats and assignee /review.
 */
export default async function AdminHomePage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  return (
    <>
      <p className="page-lead">
        <strong>관리자</strong> — 검색 키워드·전체 설정·담당자 이메일·학과/입시
        지식. 공개 통계(<Link href="/stats">/stats</Link>)·지식인 검토(
        <Link href="/review">/review</Link>)와 영역이 분리되어 있습니다. 학교명:{" "}
        <strong>혜전대학교</strong> (이명: 해전대=혜전대).
      </p>

      <section className="panel"><h2>검색 결과 수집</h2><p className="muted">등록된 활성 키워드와 선택된 검색 플랫폼을 수집합니다.</p><CollectButton /></section>
      <section className="panel">
        <h2>관리 메뉴</h2>
        <ul className="checklist">
          <li><Link href="/admin/users">사용자 계정 관리</Link></li>
          <li>
            <Link href="/admin/keywords">검색 키워드 관리</Link>
          </li>
          <li>
            <Link href="/admin/settings">전체 설정 관리</Link> — 소셜·검색 플랫폼
            체크박스 (체크분만 수집)
          </li>
          <li>
            <Link href="/admin/assignees">사이트/키워드별 담당자·이메일</Link>
          </li>
          <li>
            <Link href="/admin/knowledge">학과·입시 정보</Link>
          </li>
          <li>
            <Link href="/admin/kin">지식iN 감지 목록 (관리자 보기)</Link>
          </li>
        </ul>
        <p className="muted notice-nopost" style={{ marginBottom: 0 }}>
          지식iN 답글 자동 게시 설정은 잠금(false)입니다.
        </p>
      </section>
    </>
  );
}
