"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
/** `compact` renders the short label used in summary bars. */
export function CollectButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function run() {
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/runs", { method: "POST" }); const body = await response.json();
      if (!response.ok || !body.ok) setMessage(body.error || "수집을 완료하지 못했습니다. 서버 설정을 확인해 주세요.");
      else if (body.failures) setMessage(`수집 완료: ${body.failures}건의 오류가 있습니다. API 설정을 확인해 주세요.`);
      else setMessage("수집을 완료했습니다.");
      router.refresh();
    } catch { setMessage("수집 서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  const label = compact ? "지금 수집" : "검색 결과 수집";
  return <div className={compact ? "detect-compact" : undefined}><button className={compact ? "btn btn-sm" : "btn"} onClick={() => void run()} disabled={busy}>{busy ? "수집 중…" : label}</button>{message && (compact ? <span className="muted" role="status">{message}</span> : <p role="status">{message}</p>)}</div>;
}
