"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KinDetectPanel() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function detect() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/kin/detect", { method: "POST" });
    const json = (await res.json()) as {
      ok?: boolean;
      added?: number;
      mode?: string;
      note?: string;
    };
    setBusy(false);
    setMsg(
      json.ok
        ? `감지 ${json.mode}: +${json.added ?? 0} · ${json.note ?? ""}`
        : "감지 실패",
    );
    router.refresh();
  }

  async function draftLatest() {
    setBusy(true);
    const res = await fetch("/api/kin/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      draft?: { questionId: string };
      errorMessage?: string;
    };
    setBusy(false);
    if (!json.ok) {
      setMsg(json.errorMessage ?? "초안 실패");
      return;
    }
    setMsg("초안 생성됨");
    if (json.draft?.questionId) {
      router.push(`/admin/kin/${json.draft.questionId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="review-actions" style={{ marginBottom: "1rem" }}>
      <button type="button" className="btn" disabled={busy} onClick={() => void detect()}>
        지식iN 감지 실행
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => void draftLatest()}
      >
        최신 질문 초안 생성
      </button>
      {msg ? <span className="muted">{msg}</span> : null}
    </div>
  );
}
