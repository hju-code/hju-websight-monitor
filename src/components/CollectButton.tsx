"use client";
import { useState } from "react";
export function CollectButton() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function run() {
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/runs", { method: "POST" }); const body = await response.json();
      if (!response.ok || !body.ok) setMessage("수집을 완료하지 못했습니다. 서버 설정을 확인해 주세요.");
      else if (body.failures) setMessage(`수집 완료: ${body.failures}건의 오류가 있습니다. API 설정을 확인해 주세요.`);
      else setMessage("수집을 완료했습니다. 검색 현황에서 결과를 확인하세요.");
    } catch { setMessage("수집 서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <div><button className="btn" onClick={() => void run()} disabled={busy}>{busy ? "수집 중…" : "검색 결과 수집"}</button>{message && <p role="status">{message}</p>}</div>;
}
