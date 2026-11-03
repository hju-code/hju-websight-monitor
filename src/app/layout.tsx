import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "혜전대학교 WebSight Monitor",
  description: "혜전대학교 웹 노출 통계 · 지식iN 검토 (내부)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;600&family=Noto+Serif+KR:wght@500;600&family=Source+Sans+3:wght@400;500;600&family=Source+Serif+4:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main>
          <header className="app-header">
            <div>
              <h1 className="brand">
                혜전대학교
                <span className="brand-sub">
                  WebSight · 공개 통계 / 지식인 검토 / 관리자
                </span>
              </h1>
            </div>
            <nav aria-label="영역">
              <a href="/stats">공개 통계</a>
              <a href="/review">지식인 검토</a>
              <a href="/admin">관리자</a>
              <a href="/login">로그인</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
