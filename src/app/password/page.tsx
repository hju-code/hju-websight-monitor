"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../../components/PasswordInput";
export default function PasswordPage() {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); setMessage("");
    if (data.get("next") !== data.get("confirm")) { setMessage("새 비밀번호가 일치하지 않습니다."); setBusy(false); return; }
    try {
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current: data.get("current"), next: data.get("next") }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "변경하지 못했습니다."); return; }
      router.push("/login?passwordChanged=1"); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <section className="panel"><h2>비밀번호 변경</h2><p>새 비밀번호는 12자 이상이어야 합니다. 변경 후 다시 로그인해 주세요.</p><form className="admin-form" onSubmit={submit}>
    <div className="form-row"><label htmlFor="current">현재 비밀번호</label><PasswordInput id="current" name="current" autoComplete="current-password" required /></div>
    <div className="form-row"><label htmlFor="next">새 비밀번호</label><PasswordInput id="next" name="next" autoComplete="new-password" minLength={12} required /></div>
    <div className="form-row"><label htmlFor="confirm">새 비밀번호 확인</label><PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={12} required /></div>
    <button className="btn" disabled={busy}>비밀번호 변경</button>{message && <p role="alert">{message}</p>}
  </form></section>;
}
