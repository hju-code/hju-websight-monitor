"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KnowledgeForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: String(fd.get("category")),
        title: String(fd.get("title")),
        body: String(fd.get("body")),
        revisionLabel: String(fd.get("revision") || ""),
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    if (!json.ok) {
      setMsg(json.error ?? "저장 실패");
      return;
    }
    setMsg("저장됨");
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="category">구분</label>
          <select id="category" name="category" defaultValue="admission">
            <option value="department">학과</option>
            <option value="admission">입시</option>
            <option value="tuition">등록금·장학</option>
            <option value="campus">캠퍼스·생활</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="revision">개정 라벨</label>
          <input id="revision" name="revision" placeholder="예: 2027 입시" />
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="title">제목</label>
        <input id="title" name="title" placeholder="한눈에 보이는 제목" required />
      </div>
      <div className="form-row">
        <label htmlFor="body">본문</label>
        <textarea
          id="body"
          name="body"
          placeholder="공식 안내에 맞는 사실만 입력. 추측·미확인 내용 금지."
          required
        />
      </div>
      <div>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </button>
        {msg ? <span className="muted" style={{ marginLeft: "0.75rem" }}>{msg}</span> : null}
      </div>
    </form>
  );
}
