"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabItem = { href: string; label: string; match: (path: string) => boolean };

/** Picks the tab whose section contains the current path, so detail pages keep their parent tab highlighted. */
export function TabNav({ items, label, variant = "main" }: { items: TabItem[]; label: string; variant?: "main" | "sub" }) {
  const path = usePathname() ?? "/";
  return <nav aria-label={label} className={variant === "main" ? "tab-nav" : "sub-tab-nav"}>
    <ul>{items.map(item => {
      const active = item.match(path);
      return <li key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}>{item.label}</Link></li>;
    })}</ul>
  </nav>;
}

export function MainTabs({ canReview, isAdmin }: { canReview: boolean; isAdmin: boolean }) {
  const items: TabItem[] = [
    { href: "/stats", label: "검색 현황", match: p => p === "/" || p.startsWith("/stats") || p.startsWith("/ranks") },
    ...(canReview ? [
      { href: "/review", label: "지식iN 검토", match: (p: string) => p.startsWith("/review") && !p.startsWith("/review/history") },
      { href: "/review/history", label: "답변 기록", match: (p: string) => p.startsWith("/review/history") },
    ] : []),
    ...(isAdmin ? [{ href: "/admin", label: "관리", match: (p: string) => p.startsWith("/admin") }] : []),
  ];
  return <TabNav items={items} label="주 메뉴" />;
}
