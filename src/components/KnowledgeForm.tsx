"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractPdfInBrowser } from "../kin/pdf-browser";

export function KnowledgeForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [departmentMsg, setDepartmentMsg] = useState<string | null>(null);
  const [departmentBusy, setDepartmentBusy] = useState(false);

  async function saveDepartment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setDepartmentBusy(true); setDepartmentMsg(null);
    const form = e.currentTarget; const data = new FormData(form); data.set("category", "department");
    try {
      const res = await fetch("/api/knowledge", { method: "POST", body: data });
      const result = await res.json();
      if (!res.ok) { setDepartmentMsg(result.error || "학과 정보를 저장하지 못했습니다."); return; }
      setDepartmentMsg("학과 정보를 저장했습니다."); form.reset(); router.refresh();
    } catch { setDepartmentMsg("서버에 연결하지 못했습니다."); } finally { setDepartmentBusy(false); }
  }

  async function uploadPdf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPdfBusy(true); setPdfMsg(null);
    const form = e.currentTarget;
    try {
      const file = new FormData(form).get("pdf");
      if (!(file instanceof File) || !file.size) throw new Error("PDF 파일을 선택해 주세요.");
      setPdfMsg("PDF에서 글자를 읽고 있습니다. 잠시 기다려 주세요.");
      const extracted = await extractPdfInBrowser(file);
      setPdfMsg("검색 자료를 만들고 있습니다. 잠시 기다려 주세요.");
      const res = await fetch("/api/knowledge/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, ...extracted }) });
      const result = await res.json().catch(() => ({ error: "서버에서 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요." }));
      if (!res.ok) { setPdfMsg(result.error || "PDF 등록에 실패했습니다."); return; }
      setPdfMsg(`등록 완료: ${result.sectionCount}개 구간을 검색할 수 있습니다.${result.emptyPages ? ` 글자가 거의 없는 ${result.emptyPages}쪽은 누락됐을 수 있으니 OCR 처리 후 확인해 주세요.` : ""}`); form.reset(); router.refresh();
    } catch (error) { setPdfMsg(error instanceof Error ? error.message : "PDF를 처리하지 못했습니다."); } finally { setPdfBusy(false); }
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
      <div className="form-row"><label htmlFor="pdf">입시요강 PDF</label><input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" required /><span className="muted">PDF 1개, 최대 50MB · 최대 150쪽. 컴퓨터에서 글자를 추출합니다. 이미지로만 된 PDF는 문자 인식(OCR)이 필요합니다.</span></div>
      <button className="btn" disabled={pdfBusy}>{pdfBusy ? "PDF 분석 중…" : "PDF 등록 및 검색 준비"}</button>
      {pdfMsg && <p role="status">{pdfMsg}</p>}
    </form>
    <section className="knowledge-entry-form"><h3>학과 정보 직접 등록</h3><p className="muted">학과별 소개, 교육과정, 진로 등을 한 번에 입력하고 필요한 사진을 첨부하세요.</p>
      <form className="admin-form" onSubmit={saveDepartment}>
        <div className="form-row"><label htmlFor="department-name">학과명</label><input id="department-name" name="departmentName" placeholder="예: 간호학과" maxLength={100} required /></div>
        <div className="form-row"><label htmlFor="department-body">학과 정보</label><textarea id="department-body" name="body" placeholder="확인된 학과 정보를 입력해 주세요." maxLength={20000} required /></div>
        <div className="form-row"><label htmlFor="department-images">사진 첨부</label><input id="department-images" name="images" type="file" accept="image/jpeg,image/png" multiple /><span className="muted">JPG 또는 PNG 최대 2장, 각 750KB. 입력 자료와 사진은 GPT로 전달해 정리합니다.</span></div>
        <button className="btn" disabled={departmentBusy}>{departmentBusy ? "저장 중…" : "학과 정보 저장"}</button>{departmentMsg && <p role="status">{departmentMsg}</p>}
      </form>
    </section>
    <details><summary>직접 입력 또는 사진으로 등록</summary>
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="category">구분</label>
          <select id="category" name="category" defaultValue="admission">
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
