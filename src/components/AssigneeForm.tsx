"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AssigneeForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/assignees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigneeEmail: String(fd.get("assigneeEmail")),
        assigneeName: String(fd.get("assigneeName") || ""),
        keywordPhrase: String(fd.get("keywordPhrase")),
        siteKey: String(fd.get("siteKey")),
        isActive: true,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    setMsg(json.ok ? "등록됨" : json.error ?? "실패");
    if (json.ok) {
      e.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="assigneeEmail">이메일</label>
          <input
            id="assigneeEmail"
            name="assigneeEmail"
            type="email"
            placeholder="name@hj.ac.kr"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="assigneeName">표시 이름</label>
          <input id="assigneeName" name="assigneeName" />
        </div>
        <div className="form-row">
          <label htmlFor="keywordPhrase">키워드</label>
          <input
            id="keywordPhrase"
            name="keywordPhrase"
            placeholder="혜전대"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="siteKey">사이트</label>
          <select id="siteKey" name="siteKey" defaultValue="naver-kin">
            <option value="naver-kin">naver-kin</option>
            <option value="naver-web">naver-web</option>
            <option value="daum-web">daum-web</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "등록 중…" : "등록"}
      </button>
      {msg ? <p className="muted">{msg}</p> : null}
    </form>
  );
}
