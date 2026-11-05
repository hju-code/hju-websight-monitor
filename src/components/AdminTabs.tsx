"use client";
import { TabNav, type TabItem } from "./MainTabs";

const under = (base: string) => (p: string) => p === base || p.startsWith(`${base}/`);
const ITEMS: TabItem[] = [
  { href: "/admin", label: "개요", match: p => p === "/admin" },
  { href: "/admin/users", label: "사용자", match: under("/admin/users") },
  { href: "/admin/keywords", label: "검색 키워드", match: under("/admin/keywords") },
  { href: "/admin/assignees", label: "담당자 배정", match: under("/admin/assignees") },
  { href: "/admin/knowledge", label: "학과·입시 정보", match: under("/admin/knowledge") },
  { href: "/admin/kin", label: "지식iN 감지", match: under("/admin/kin") },
  { href: "/admin/settings", label: "전체 설정", match: under("/admin/settings") },
];

export function AdminTabs() {
  return <TabNav items={ITEMS} label="관리 메뉴" variant="sub" />;
}
