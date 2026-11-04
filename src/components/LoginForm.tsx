"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "로그인하지 못했습니다."); return; }
      router.push(result.redirect); router.refresh();
    } catch { setError("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <form className="admin-form" onSubmit={submit}>
    <div className="form-row"><label htmlFor="email">이메일</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
    <div className="form-row"><label htmlFor="password">비밀번호</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
    <button className="btn" disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
