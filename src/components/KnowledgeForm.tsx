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
    const form = e.currentTarget;
    const fd = new FormData(form);
    let json: { ok?: boolean; error?: string };
    try {
      const res = await fetch("/api/knowledge", { method: "POST", body: fd });
      json = await res.json();
    } catch { setBusy(false); setMsg("서버에 연결하지 못했습니다."); return; }
    setBusy(false);
    if (!json.ok) {
      setMsg(json.error ?? "저장 실패");
      return;
    }
    setMsg("정리 및 저장 완료");
    form.reset();
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
      <div className="form-row"><label htmlFor="images">사진 첨부</label><input id="images" name="images" type="file" accept="image/jpeg,image/png" multiple /><span className="muted">JPG 또는 PNG, 최대 2장, 각 750KB. 자료와 함께 GPT로 전송해 내용을 정리합니다.</span></div>
      <div>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "자료 정리 중…" : "자료 정리 및 저장"}
        </button>
        {msg ? <span className="muted" style={{ marginLeft: "0.75rem" }}>{msg}</span> : null}
      </div>
    </form>
  );
}
