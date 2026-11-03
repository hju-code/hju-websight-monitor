"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("advisor@example.com");
  const [msg, setMsg] = useState<string | null>(null);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setMagicUrl(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      magicUrl?: string;
      note?: string;
    };
    setBusy(false);
    if (!json.ok) {
      setMsg(json.error ?? "실패");
      return;
    }
    setMsg(json.note ?? "매직링크 준비됨");
    if (json.magicUrl) setMagicUrl(json.magicUrl);
  }

  async function devLogin(roleHint: "admin" | "assignee") {
    setBusy(true);
    setMsg(null);
    const target =
      roleHint === "admin"
        ? "websight-admin@hj.ac.kr"
        : email || "advisor@example.com";
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target, mode: "dev_session" }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      redirect?: string;
      user?: { role: string; email: string };
    };
    setBusy(false);
    if (!json.ok) {
      setMsg(json.error ?? "개발 로그인 실패");
      return;
    }
    setMsg(`${json.user?.email} (${json.user?.role}) 로그인`);
    router.push(json.redirect || "/review");
    router.refresh();
  }

  return (
    <div className="admin-form">
      <form onSubmit={requestMagic}>
        <div className="form-row">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="등록된 담당자 또는 관리자 이메일"
            required
          />
        </div>
        <div className="review-actions" style={{ marginTop: "1rem" }}>
          <button type="submit" className="btn" disabled={busy}>
            매직링크 받기
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => void devLogin("assignee")}
          >
            개발: 담당자 세션
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void devLogin("admin")}
          >
            개발: 관리자 세션
          </button>
        </div>
      </form>
      {msg ? <p className="muted">{msg}</p> : null}
      {magicUrl ? (
        <p className="notice-nopost">
          개발용 매직링크:{" "}
          <a href={magicUrl}>{magicUrl}</a>
        </p>
      ) : null}
      <p className="muted" style={{ marginBottom: 0 }}>
        시드 계정 — 관리자 <code>websight-admin@hj.ac.kr</code> · 담당자{" "}
        <code>advisor@example.com</code>. 역할은 분리되며 자동 게시 없음.
      </p>
    </div>
  );
}
