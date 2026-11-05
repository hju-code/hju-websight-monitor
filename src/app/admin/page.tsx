import { CollectButton } from "../../components/CollectButton";
import Link from "next/link";
import { requireRole } from "../../auth/session";
import { redirect } from "next/navigation";
import { PageHeader } from "../../components/PageHeader";
import { WEEKLY_CRON } from "../../config/schedule";

const MENU = [
  { href: "/admin/users", title: "사용자", body: "계정 생성, 비밀번호 초기화, 사용 중지" },
  { href: "/admin/keywords", title: "검색 키워드", body: "순위 수집과 지식iN 감지에 쓰는 키워드" },
  { href: "/admin/assignees", title: "담당자 배정", body: "사이트·키워드별 답변 담당자 지정" },
  { href: "/admin/knowledge", title: "학과·입시 정보", body: "답변 작성에 쓰는 학과·입시요강 자료" },
  { href: "/admin/kin", title: "지식iN 감지", body: "감지한 전체 질문 목록과 수동 감지" },
  { href: "/admin/settings", title: "전체 설정", body: "수집 플랫폼 선택과 보존 기간" },
];

/**
 * Admin hub — keywords, sites/settings, assignees, knowledge.
 * Separate from public /stats and assignee /review.
 */
export default async function AdminHomePage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  return (
    <>
      <PageHeader eyebrow="관리" title="관리 개요">검색 키워드, 담당자, 학과·입시 자료와 수집 설정을 관리합니다. 학교명: <strong>혜전대학교</strong> (이명: 해전대=혜전대)</PageHeader>

      <section className="panel panel-split">
        <div><h2>검색 결과 수집</h2><p className="muted">등록된 활성 키워드와 선택된 검색 플랫폼의 순위를 지금 바로 수집합니다. 정기 수집: {WEEKLY_CRON.label}(한국 시간)쯤</p></div>
        <CollectButton />
      </section>

      <section aria-labelledby="admin-menu-title">
        <h2 id="admin-menu-title" className="section-title">관리 메뉴</h2>
        <ul className="card-grid">
          {MENU.map(item => <li key={item.href}><Link href={item.href} className="nav-card"><strong>{item.title}</strong><span>{item.body}</span><span className="nav-card-arrow" aria-hidden="true">→</span></Link></li>)}
        </ul>
      </section>

      <p className="notice">지식iN 답글 자동 게시는 잠겨 있습니다. 답변은 담당자가 네이버에서 직접 게시합니다.</p>
    </>
  );
}
