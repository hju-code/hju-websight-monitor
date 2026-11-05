"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** `compact` shows only the run button, for the review page summary bar. */
export function KinDetectPanel({ latestQuestionId, answerBase = "/admin/kin", compact = false }: { latestQuestionId?: string; answerBase?: string; compact?: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function detect() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kin/detect", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        added?: number;
        error?: string;
        partial?: boolean;
        failures?: number;
      };
      setMsg(
        json.ok
          ? `새 질문 ${json.added ?? 0}건${json.partial ? ` · ${json.failures}개 키워드 조회 실패` : ""}`
          : json.error ?? "감지 실패",
      );
      router.refresh();
    } catch {
      setMsg("서버에 연결하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <div className="detect-compact">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void detect()}>
          {busy ? "감지 중…" : "지금 감지"}
        </button>
        {msg ? <span className="muted" role="status">{msg}</span> : null}
      </div>
    );
  }

  return (
    <div className="review-actions" style={{ marginBottom: "1rem" }}>
      <button type="button" className="btn" disabled={busy} onClick={() => void detect()}>
        {busy ? "감지 중…" : "지식iN 감지 실행"}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy || !latestQuestionId}
        onClick={() => router.push(`${answerBase}/${latestQuestionId}`)}
      >
        최신 질문 답변 작성
      </button>
      {msg ? <span className="muted" role="status">{msg}</span> : null}
    </div>
  );
}
