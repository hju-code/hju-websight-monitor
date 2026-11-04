"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KnowledgeForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  async function uploadPdf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPdfBusy(true); setPdfMsg(null);
    const form = e.currentTarget;
    try {
      const res = await fetch("/api/knowledge/pdf", { method: "POST", body: new FormData(form) });
      const result = await res.json();
      if (!res.ok) { setPdfMsg(result.error || "PDF 등록에 실패했습니다."); return; }
      setPdfMsg(`등록 완료: ${result.sectionCount}개 구간을 검색할 수 있습니다.${result.emptyPages ? ` 글자가 거의 없는 ${result.emptyPages}쪽은 누락됐을 수 있으니 OCR 처리 후 확인해 주세요.` : ""}`); form.reset(); router.refresh();
    } catch { setPdfMsg("서버에 연결하지 못했습니다."); } finally { setPdfBusy(false); }
  }

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

  return <>
    <form className="admin-form" onSubmit={uploadPdf}>
      <div className="form-row"><label htmlFor="pdf">입시요강 PDF</label><input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" required /><span className="muted">PDF 1개, 최대 3.5MB · 최대 150쪽. 글자를 추출해 검색 자료로 저장합니다. 이미지로만 된 PDF는 문자 인식(OCR)이 필요합니다.</span></div>
      <button className="btn" disabled={pdfBusy}>{pdfBusy ? "PDF 분석 중…" : "PDF 등록 및 검색 준비"}</button>
      {pdfMsg && <p role="status">{pdfMsg}</p>}
    </form>
    <details><summary>직접 입력 또는 사진으로 등록</summary>
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
    </form></details>
  </>;
}
