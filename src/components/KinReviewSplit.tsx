"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KinDraft, KinQuestion } from "../kin/types";
export function KinReviewSplit({ question, draft: initial }: { question: KinQuestion; draft: KinDraft | null }) {
  const [draft, setDraft] = useState(initial); const [text, setText] = useState(initial?.draftBody ?? "");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  const [topic, setTopic] = useState("");
  async function send(action: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, questionId: question.id, draftId: action === "save" || action === "generate" || action === "ai_generate" ? undefined : draft?.id, body: text, topic: action === "ai_generate" ? topic : undefined }) });
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
    <section className="review-pane"><h2>질문</h2><h3>{question.title}</h3><p className="muted">{new Date(question.detectedAt).toLocaleString("ko-KR")}</p><p className="review-body">{question.questionText}</p><p><a href={question.naverUrl} target="_blank" rel="noopener noreferrer">네이버에서 질문과 답변 확인하기 ↗</a></p><p>{question.status === "manual_posted" ? "혜전대학교 답변 확인됨 (담당자 표시)" : "혜전대학교 답변 여부 미확인"}</p><p className="muted">네이버 원문에서 확인한 뒤 상태를 표시해 주세요. 자동 확인은 아닙니다.</p><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void markAnswer(question.status !== "manual_posted")}>{question.status === "manual_posted" ? "확인 표시 해제" : "혜전대학교 답변 확인 표시"}</button></section>
    <section className="review-pane review-pane-draft"><h2>답변 작성</h2><p className="muted">답변을 저장하고 검토한 뒤 네이버에서 직접 게시합니다.</p><div className="admin-form"><label htmlFor="answer">답변 내용</label><textarea id="answer" value={text} onChange={e => setText(e.target.value)} maxLength={20000} /></div>
      <div className="admin-form"><label htmlFor="ai-topic">학교 자료에서 찾을 주제</label><input id="ai-topic" value={topic} onChange={e => setTopic(e.target.value)} maxLength={400} placeholder="예: 간호학과 지원 자격" /><p className="muted">학교 업무 주제를 직접 입력해 주세요. 네이버 검색 결과와 그 파생 내용을 입력하지 마세요. 학교 자료와 이 주제만 GPT에 전달됩니다.</p></div>
      <div className="review-actions"><button className="btn" disabled={busy || !text.trim()} onClick={() => void send("save")}>답변 저장</button><button className="btn btn-secondary" disabled={busy || !topic.trim()} onClick={() => void send("ai_generate")}>{busy ? "처리 중…" : "GPT 초안 생성"}</button><button className="btn btn-ghost" disabled={!text.trim()} onClick={() => void copy()}>내용 복사</button></div>{message && <p role="status">{message}</p>}</section>
  </div>;
}
