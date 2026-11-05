import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCurrentSession } from "../auth/session";
import { LogoutButton } from "../components/LogoutButton";
import { SessionStatus } from "../components/SessionStatus";
import { MainTabs } from "../components/MainTabs";
import "./globals.css";
export const metadata: Metadata = { title: "혜전대학교 WebSight", description: "혜전대학교 웹 검색 현황과 지식iN 검토" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  const user = session?.user;
  const active = !!user && !user.mustChangePassword;
  const name = user ? user.displayName || user.email : "";
  return <html lang="ko"><body><div className="site-shell">
    <header className="site-header">
      <div className="header-inner">
        <Link href="/stats" className="brand-lockup"><Image className="university-logo" src="/hyejeon-logo.png" alt="혜전대학교" width={180} height={50} priority /><span className="brand-service">WebSight</span></Link>
        <div className="account-nav">{user && session ? <>
          <span className="account-identity"><span className="account-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span><span className="account-text"><span className="account-name">{name}</span><span className="account-role">{user.role === "admin" ? "관리자" : "사용자"}{user.displayName ? ` · ${user.email}` : ""}</span></span></span>
          <SessionStatus initialExpiry={session.expiresAt} />
          <span className="account-links"><Link href="/password">비밀번호 변경</Link><LogoutButton /></span>
        </> : <Link href="/login" className="btn btn-secondary btn-sm">로그인</Link>}</div>
      </div>
      <div className="tab-bar"><div className="tab-bar-inner"><MainTabs canReview={active && (user.role === "admin" || user.role === "assignee")} isAdmin={active && user.role === "admin"} /></div></div>
    </header>
    {user?.mustChangePassword && <div className="password-required" role="status">지식iN 검토를 이용하려면 초기 비밀번호를 먼저 변경해 주세요. <Link href="/password">비밀번호 변경하기</Link></div>}
    <main className="main-content">{children}</main>
    <footer className="site-footer">혜전대학교 · WebSight 검색 현황</footer>
  </div></body></html>;
}
