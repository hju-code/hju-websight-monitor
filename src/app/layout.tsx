import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCurrentSession } from "../auth/session";
import { LogoutButton } from "../components/LogoutButton";
import { SessionStatus } from "../components/SessionStatus";
import "./globals.css";
export const metadata: Metadata = { title: "혜전대학교 WebSight", description: "혜전대학교 웹 검색 현황과 지식iN 검토" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  const user = session?.user;
  return <html lang="ko"><body><div className="site-shell">
    <header className="site-header"><div className="header-inner">
      <Link href="/stats" className="brand-lockup"><Image className="university-logo" src="/hyejeon-logo.png" alt="혜전대학교" width={180} height={50} priority /><span className="brand-service">WebSight</span></Link>
      <nav aria-label="주 메뉴"><Link href="/stats">검색 현황</Link>{user && !user.mustChangePassword && (user.role === "admin" || user.role === "assignee") && <><Link href="/review">지식iN 검토</Link><Link href="/review/history">답변 기록 보기</Link></>}{user?.role === "admin" && !user.mustChangePassword && <Link href="/admin">관리</Link>}</nav>
      <div className="account-nav">{user && session ? <><span className="account-identity">{user.displayName || user.email} ({user.role === "admin" ? "관리자" : "사용자"})<span className="account-email">{user.displayName ? user.email : ""}</span></span><SessionStatus initialExpiry={session.expiresAt} /><Link href="/password">비밀번호 변경</Link><LogoutButton /></> : <Link href="/login">로그인</Link>}</div>
    </div></header>
    {user?.mustChangePassword && <div className="password-required" role="status">지식iN 검토를 이용하려면 초기 비밀번호를 먼저 변경해 주세요. <Link href="/password">비밀번호 변경하기</Link></div>}
    <main className="main-content">{children}</main>
    <footer className="site-footer">혜전대학교 · WebSight 검색 현황</footer>
  </div></body></html>;
}
