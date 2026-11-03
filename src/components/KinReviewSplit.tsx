"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KinDraft, KinQuestion } from "../kin/types";

/**
 * Side-by-side review: question | draft.
 * Desktop 2-col, mobile stacked. No auto-post control.
 */
export function KinReviewSplit(props: {
  question: KinQuestion;
  draft: KinDraft | null;
}) {
  const { question } = props;
  const [draft, setDraft] = useState(props.draft);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function generate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/kin/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", questionId: question.id }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      draft?: KinDraft;
      errorMessage?: string;
    };
    setBusy(false);
    if (!json.ok || !json.draft) {
      setMsg(json.errorMessage ?? "초안 생성 실패");
      return;
    }
    setDraft(json.draft);
    setMsg("초안 생성됨 — 자동 게시 없음");
    router.refresh();
  }

  async function act(action: "approve" | "reject" | "copied_for_manual_post") {
    if (!draft) return;
    setBusy(true);
    const res = await fetch("/api/kin/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, draftId: draft.id }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      draft?: KinDraft;
      error?: string;
      note?: string;
    };
    setBusy(false);
    if (!json.ok || !json.draft) {
      setMsg(json.error ?? "실패");
      return;
    }
    setDraft(json.draft);
    setMsg(json.note ?? "저장됨");
    router.refresh();
  }

  return (
    <div className="review-split" data-autopost="disabled">
      <section className="review-pane" aria-labelledby="kin-q-heading">
        <div className="review-pane-label" id="kin-q-heading">
          원본 질문
        </div>
        <h2 className="review-title">{question.title}</h2>
        <p className="review-meta muted">
          감지 {new Date(question.detectedAt).toLocaleString("ko-KR")} ·{" "}
          <a href={question.naverUrl} target="_blank" rel="noopener noreferrer">
            네이버에서 열기
          </a>
        </p>
        <div className="review-body">{question.questionText}</div>
        {question.matchedAliases.length > 0 && (
          <p className="muted" style={{ marginTop: "1rem" }}>
            매칭 별칭: {question.matchedAliases.join(", ")}
          </p>
        )}
      </section>

      <section className="review-pane review-pane-draft" aria-labelledby="kin-d-heading">
        <div className="review-pane-label" id="kin-d-heading">
          초안 답변
        </div>
        {draft ? (
          <>
            <p className="review-meta muted">
              상태 <span className="badge warn">{draft.status}</span> · 자동 게시{" "}
              <strong>없음</strong>
            </p>
            <pre className="review-body draft-text">{draft.draftBody}</pre>
            <div className="review-actions">
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => void act("approve")}
              >
                승인 (저장만)
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => void act("reject")}
              >
                반려
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => {
                  void navigator.clipboard?.writeText(draft.draftBody);
                  void act("copied_for_manual_post");
                }}
              >
                복사 후 네이버 붙여넣기
              </button>
              <a
                className="btn btn-ghost"
                href={question.naverUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                네이버 열기
              </a>
            </div>
            <p className="muted notice-nopost">
              이 앱은 네이버에 답글을 <strong>자동 게시하지 않습니다</strong>. 승인·복사는
              작업용이며, 게시는 네이버 UI에서 직접 수행합니다.
            </p>
          </>
        ) : (
          <div>
            <p className="muted">초안 없음 — 지식 베이스에서 생성하세요.</p>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void generate()}
            >
              초안 생성
            </button>
          </div>
        )}
        {msg ? <p className="muted">{msg}</p> : null}
      </section>
    </div>
  );
}
