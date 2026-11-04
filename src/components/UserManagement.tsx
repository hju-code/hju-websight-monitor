"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Account } from "../auth/password-service";
export function UserManagement({ users }: { users: Account[] }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function send(body: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try { const res = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const out = await res.json(); setMessage(res.ok ? "저장했습니다." : out.error || "저장하지 못했습니다."); if (res.ok) router.refresh(); return res.ok; }
    catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  function create(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); void send({ action: "create", email: f.get("email"), name: f.get("name"), password: f.get("password") }).then(ok => { if (ok) form.reset(); }); }
  return <>
    <section className="panel"><h2>사용자 추가</h2><p className="muted">초기 비밀번호는 15자 이상입니다. 사용자에게 안전한 방법으로 전달해 주세요.</p><form className="admin-form" onSubmit={create}>
      <div className="form-row"><label htmlFor="new-email">이메일</label><input id="new-email" name="email" type="email" required /></div>
      <div className="form-row"><label htmlFor="new-name">이름</label><input id="new-name" name="name" /></div>
      <div className="form-row"><label htmlFor="new-password">초기 비밀번호</label><input id="new-password" name="password" type="password" minLength={15} autoComplete="new-password" required /></div>
      <button className="btn" disabled={busy}>사용자 추가</button></form></section>
    <section className="panel"><h2>계정</h2><table><thead><tr><th>이메일</th><th>이름</th><th>역할</th><th>상태</th><th>관리</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td>{u.email}</td><td>{u.displayName || "—"}</td><td>{u.role === "admin" ? "관리자" : "사용자"}</td><td>{u.isActive ? "활성" : "비활성"}</td><td>{u.role !== "admin" && <><button className="btn btn-ghost" disabled={busy} onClick={() => void send({ action: "active", id: u.id, active: !u.isActive })}>{u.isActive ? "비활성화" : "활성화"}</button><details><summary>비밀번호 초기화</summary><form className="admin-form" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const password = new FormData(form).get("password"); void send({ action: "reset", id: u.id, password }).then(ok => { if (ok) form.reset(); }); }}><label htmlFor={`reset-${u.id}`}>새 임시 비밀번호</label><input id={`reset-${u.id}`} name="password" type="password" minLength={15} required autoComplete="new-password" /><button className="btn" disabled={busy}>초기화</button></form></details></>}</td></tr>)}</tbody></table>{message && <p role="status">{message}</p>}</section>
  </>;
}
