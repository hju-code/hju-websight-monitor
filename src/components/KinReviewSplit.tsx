"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KinDraft, KinQuestion } from "../kin/types";
export function KinReviewSplit({ question, draft: initial, departments }: { question: KinQuestion; draft: KinDraft | null; departments: string[] }) {
  const [draft, setDraft] = useState(initial); const [text, setText] = useState(initial?.draftBody ?? "");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  const [topic, setTopic] = useState("");
  const [department, setDepartment] = useState("");
  const [rewriteScope, setRewriteScope] = useState("university");
  async function send(action: string, scope = "auto") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, questionId: question.id, draftId: action === "save" || action === "generate" || action === "ai_generate" ? undefined : draft?.id, body: action === "ai_generate" && scope === "auto" ? "" : text, topic: action === "ai_generate" ? topic : undefined, department: action === "ai_generate" ? department : undefined, scope: action === "ai_generate" ? scope : undefined }) });
      const result = await response.json();
      if (!response.ok || !result.ok) { setMessage(result.error || result.errorMessage || "처리하지 못했습니다."); return; }
      setDraft(result.draft); setText(result.draft.draftBody); setMessage("저장했습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage("복사했습니다. 네이버에서 직접 붙여넣어 주세요."); } catch { setMessage("복사하지 못했습니다. 내용을 직접 선택해 복사해 주세요."); }
  }
  async function markAnswer(answered: boolean) {
    if (answered && !window.confirm("네이버 원문에서 혜전대학교 답변을 직접 확인했습니까?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: answered ? "mark_answered" : "clear_answered", questionId: question.id }) });
      if (!response.ok) { setMessage("답변 상태를 저장하지 못했습니다."); return; }
      setMessage(answered ? "답변 확인 상태를 저장했습니다." : "답변 확인 표시를 해제했습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <div className="review-split">
    <section className="review-pane"><h2>질문</h2><h3>{question.title}</h3><p className="muted">{new Date(question.detectedAt).toLocaleString("ko-KR")}</p><p className="review-body">{question.questionText}</p><p><a href={question.naverUrl} target="_blank" rel="noopener noreferrer">네이버에서 질문과 답변 확인하기 ↗</a></p><p>{question.status === "manual_posted" ? "혜전대학교 답변 확인됨 (담당자 표시)" : "혜전대학교 답변 여부 미확인"}</p><p className="muted">네이버에서 혜전대학교 답변이 있는 경우 아래 버튼을 눌러 주세요. 목록에 답변 확인으로 표시됩니다.</p><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void markAnswer(question.status !== "manual_posted")}>{question.status === "manual_posted" ? "확인 표시 해제" : "혜전대학교 답변 확인 표시"}</button></section>
    <section className="review-pane review-pane-draft"><h2>답변 작성</h2><p className="muted">질문을 입력한 뒤 답변을 생성하고, 확인 후 네이버에서 직접 게시하세요.</p>
      <div className="admin-form"><label htmlFor="ai-topic">질문 입력</label><textarea id="ai-topic" value={topic} onChange={e => setTopic(e.target.value)} maxLength={4000} placeholder="답변할 질문을 입력해 주세요." /><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { if (topic.trim() && !window.confirm("입력한 내용을 질문 제목으로 바꾸시겠습니까?")) return; setTopic(question.title); }}>질문 제목 가져오기</button><p className="muted">검색 결과의 제목만 가져옵니다. 네이버 원문에서 질문 내용을 확인하고 필요한 내용을 보완해 주세요. 답변 생성 시 입력 내용이 GPT로 전달됩니다.</p></div>
      <div className="review-actions"><button className="btn btn-secondary" disabled={busy || !topic.trim()} onClick={() => void send("ai_generate")}>{busy ? "처리 중…" : "답변 생성"}</button></div>
      <div className="admin-form"><label htmlFor="answer">답변 내용</label><textarea id="answer" value={text} onChange={e => setText(e.target.value)} maxLength={20000} /></div>
      {text.trim() && <details><summary>답변 다시 작성</summary><div className="admin-form"><label htmlFor="rewrite-scope">참고 범위</label><select id="rewrite-scope" value={rewriteScope} onChange={e => setRewriteScope(e.target.value)}><option value="university">대학 정보</option><option value="department">학과 정보</option><option value="both">대학 + 학과 정보</option></select>{rewriteScope !== "university" && <><label htmlFor="rewrite-department">학과</label><select id="rewrite-department" value={department} onChange={e => setDepartment(e.target.value)}><option value="">학과를 선택해 주세요</option>{departments.map(name => <option key={name} value={name}>{name}</option>)}</select></>}<button type="button" className="btn btn-secondary" disabled={busy || !topic.trim() || (rewriteScope !== "university" && !department)} onClick={() => void send("ai_generate", rewriteScope)}>선택한 범위로 다시 작성</button></div></details>}
      <div className="review-actions"><button className="btn" disabled={busy || !text.trim()} onClick={() => void send("save")}>답변 저장</button><button className="btn btn-ghost" disabled={!text.trim()} onClick={() => void copy()}>내용 복사</button></div>{message && <p role="status">{message}</p>}</section>
  </div>;
}
