"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KeywordForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase: String(fd.get("phrase")) }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    setMsg(json.ok ? "저장됨" : json.error ?? "실패");
    if (json.ok) {
      e.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="phrase">키워드</label>
          <input
            id="phrase"
            name="phrase"
            placeholder="예: 혜전대 간호학과"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "저장 중…" : "저장"}
      </button>
      {msg ? <p className="muted">{msg}</p> : null}
    </form>
  );
}
