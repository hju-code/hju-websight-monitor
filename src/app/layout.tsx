import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCurrentUser } from "../auth/session";
import { LogoutButton } from "../components/LogoutButton";
import "./globals.css";
export const metadata: Metadata = { title: "혜전대학교 WebSight", description: "혜전대학교 웹 검색 현황과 지식iN 검토" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return <html lang="ko"><body><div className="site-shell">
    <header className="site-header"><div className="header-inner">
      <Link href="/stats" className="brand-lockup"><Image className="university-logo" src="/hyejeon-logo.png" alt="혜전대학교" width={180} height={50} priority /><span className="brand-service">WebSight</span></Link>
      <nav aria-label="주 메뉴"><Link href="/stats">검색 현황</Link>{user && !user.mustChangePassword && (user.role === "admin" || user.role === "assignee") && <><Link href="/review">지식iN 검토</Link><Link href="/review/history">답변 기록 보기</Link></>}{user?.role === "admin" && !user.mustChangePassword && <Link href="/admin">관리</Link>}</nav>
      <div className="account-nav">{user ? <><Link href="/password">비밀번호 변경</Link><LogoutButton /></> : <Link href="/login">로그인</Link>}</div>
    </div></header>
    <main className="main-content">{children}</main>
    <footer className="site-footer">혜전대학교 · WebSight 검색 현황</footer>
  </div></body></html>;
}
