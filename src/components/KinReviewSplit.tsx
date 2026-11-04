"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KinDraft, KinQuestion } from "../kin/types";
export function KinReviewSplit({ question, draft: initial }: { question: KinQuestion; draft: KinDraft | null }) {
  const [draft, setDraft] = useState(initial); const [text, setText] = useState(initial?.draftBody ?? "");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function send(action: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/kin/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, questionId: question.id, draftId: action === "save" || action === "generate" ? undefined : draft?.id, body: text }) });
      const result = await response.json();
      if (!response.ok || !result.ok) { setMessage(result.error || result.errorMessage || "처리하지 못했습니다."); return; }
      setDraft(result.draft); setText(result.draft.draftBody); setMessage("저장했습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage("복사했습니다. 네이버에서 직접 붙여넣어 주세요."); } catch { setMessage("복사하지 못했습니다. 내용을 직접 선택해 복사해 주세요."); }
  }
  return <div className="review-split">
    <section className="review-pane"><h2>질문</h2><h3>{question.title}</h3><p className="muted">{new Date(question.detectedAt).toLocaleString("ko-KR")}</p><p className="review-body">{question.questionText}</p><p><a href={question.naverUrl} target="_blank" rel="noopener noreferrer">네이버에서 질문 열기</a></p></section>
    <section className="review-pane review-pane-draft"><h2>답변 작성</h2><p className="muted">답변을 저장하고 검토한 뒤 네이버에서 직접 게시합니다.</p><div className="admin-form"><label htmlFor="answer">답변 내용</label><textarea id="answer" value={text} onChange={e => setText(e.target.value)} maxLength={20000} /></div>
      <div className="review-actions"><button className="btn" disabled={busy || !text.trim()} onClick={() => void send("save")}>답변 저장</button><button className="btn btn-secondary" disabled={busy} onClick={() => void send("generate")}>지식에서 초안 생성</button><button className="btn btn-ghost" disabled={!text.trim()} onClick={() => void copy()}>내용 복사</button></div>{message && <p role="status">{message}</p>}</section>
  </div>;
}
