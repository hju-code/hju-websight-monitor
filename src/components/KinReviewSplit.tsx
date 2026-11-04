"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { KinQuestion } from "../kin/types";
export function KinReviewSplit({ question, departments }: { question: KinQuestion; departments: string[] }) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  const [topic, setTopic] = useState("");
  const [department, setDepartment] = useState("");
  const [rewriteScope, setRewriteScope] = useState("university");
  async function send(action: string, scope = "auto") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, questionId: question.id, body: action === "ai_generate" && scope === "auto" ? "" : text, topic: action === "ai_generate" ? topic : undefined, department: action === "ai_generate" ? department : undefined, scope: action === "ai_generate" ? scope : undefined }) });
      const result = await response.json();
      if (!response.ok || !result.ok) { setMessage(result.error || result.errorMessage || "처리하지 못했습니다."); return; }
      if (action === "ai_generate") { setText(result.answer); setMessage("답변을 생성했습니다. 내용을 확인해 주세요."); }
      else { setMessage("답변 기록에 저장했습니다."); router.refresh(); }
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage("복사했습니다. 네이버에서 직접 붙여넣어 주세요."); } catch { setMessage("복사하지 못했습니다. 내용을 직접 선택해 복사해 주세요."); }
  }
  async function markAnswer(answered: boolean) {
    if (answered && !text.trim()) { setMessage("기록할 답변 내용을 입력한 후 확인 표시를 눌러 주세요."); return; }
    if (answered && !window.confirm("네이버 원문에서 혜전대학교 답변을 직접 확인했습니까?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: answered ? "mark_answered" : "clear_answered", questionId: question.id, body: answered ? text : undefined }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "답변 상태를 저장하지 못했습니다."); return; }
      setMessage(answered ? "답변 확인 상태와 기록을 저장했습니다." : "답변 확인 표시를 해제했습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  async function markNotNeeded() {
    if (!window.confirm("이 질문을 답변이 필요 없는 항목으로 표시하시겠습니까?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mark_not_needed", questionId: question.id }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "상태를 저장하지 못했습니다."); return; }
      setMessage("답변 필요없음으로 표시했습니다. 답변 기록에서 확인할 수 있습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <div className="review-split">
    <section className="review-pane"><h2>질문</h2><h3>{question.title}</h3><p className="muted">{new Date(question.detectedAt).toLocaleString("ko-KR")}</p><p className="review-body">{question.questionText}</p><p><a href={question.naverUrl} target="_blank" rel="noopener noreferrer">네이버에서 질문과 답변 확인하기 ↗</a></p><p>{question.status === "manual_posted" ? "혜전대학교 답변 확인됨 (담당자 표시)" : question.status === "dismissed" ? "답변 필요없음 (담당자 표시)" : "혜전대학교 답변 여부 미확인"}</p><div className="review-actions">{question.status === "manual_posted" || question.status === "dismissed" ? <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void markAnswer(false)}>표시 해제</button> : <><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void markAnswer(true)}>혜전대학교 답변 확인 표시</button><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void markNotNeeded()}>답변 필요없음 표시</button></>}</div><p className="muted">답변을 작성한 경우 답변 확인을, 답변할 필요가 없는 질문은 답변 필요없음을 눌러주세요.</p>{message && <p role="status">{message}</p>}</section>
    <section className="review-pane review-pane-draft"><h2>답변 작성</h2><p className="muted">질문을 입력한 뒤 답변을 생성하고, 확인 후 네이버에서 직접 게시하세요.</p>
      <ol className="answer-steps" aria-label="답변 작성 순서"><li><strong>1. 질문 확인</strong><span>네이버에서 질문을 열어 내용을 확인합니다.</span></li><li><strong>2. 질문 붙여넣기</strong><span>질문을 복사해 아래 입력칸에 붙여넣습니다.</span></li><li><strong>3. 답변 생성·검토</strong><span>답변 생성 버튼을 누르고 내용을 확인합니다.</span></li><li><strong>4. 네이버에 등록</strong><span>검토한 답변을 복사해 네이버에서 직접 작성합니다.</span></li></ol>
      <div className="admin-form"><label htmlFor="ai-topic">질문 입력</label><textarea id="ai-topic" value={topic} onChange={e => setTopic(e.target.value)} maxLength={4000} placeholder="네이버에서 확인한 질문을 복사해 붙여넣어 주세요." /><p className="muted">답변 생성 시 입력한 질문과 학교 자료가 GPT로 전달됩니다.</p></div>
      <div className="review-actions"><button className="btn btn-secondary" disabled={busy || !topic.trim()} onClick={() => void send("ai_generate")}>{busy ? "처리 중…" : "답변 생성"}</button></div>
      <div className="admin-form"><label htmlFor="answer">답변 내용</label><textarea className="answer-editor" id="answer" value={text} onChange={e => setText(e.target.value)} maxLength={20000} placeholder="생성된 답변을 확인하고 직접 수정할 수 있습니다." /></div>
      {text.trim() && <details><summary>답변 다시 작성</summary><div className="admin-form"><label htmlFor="rewrite-scope">참고 범위</label><select id="rewrite-scope" value={rewriteScope} onChange={e => setRewriteScope(e.target.value)}><option value="university">대학 정보</option><option value="department">학과 정보</option><option value="both">대학 + 학과 정보</option></select>{rewriteScope !== "university" && <><label htmlFor="rewrite-department">학과</label><select id="rewrite-department" value={department} onChange={e => setDepartment(e.target.value)}><option value="">학과를 선택해 주세요</option>{departments.map(name => <option key={name} value={name}>{name}</option>)}</select></>}<button type="button" className="btn btn-secondary" disabled={busy || !topic.trim() || (rewriteScope !== "university" && !department)} onClick={() => void send("ai_generate", rewriteScope)}>선택한 범위로 다시 작성</button></div></details>}
      <div className="review-actions"><button className="btn" disabled={busy || !text.trim()} onClick={() => void send("save")}>답변 기록에 저장</button><button className="btn btn-ghost" disabled={!text.trim()} onClick={() => void copy()}>내용 복사</button><Link href="/review/history">답변 기록 보기</Link></div>{message && <p role="status">{message}</p>}</section>
  </div>;
}
