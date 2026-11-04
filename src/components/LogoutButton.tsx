"use client";
import { useRouter } from "next/navigation";
export function LogoutButton() {
  const router = useRouter();
  return <button className="nav-button" onClick={async () => { const result = await fetch("/api/auth", { method: "DELETE" }); if (result.ok) { router.push("/login"); router.refresh(); } }}>로그아웃</button>;
}
