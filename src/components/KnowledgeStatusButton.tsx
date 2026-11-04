"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function KnowledgeStatusButton({ id, title, active }: { id: string; title: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function change() {
    if (active && !window.confirm(`‘${title}’ 자료를 삭제 목록으로 옮길까요? 답변 검색에서 제외되며 나중에 복원할 수 있습니다.`)) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/knowledge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
      if (!res.ok) { setMessage("처리하지 못했습니다. 다시 시도해 주세요."); return; }
      setMessage(active ? "삭제 목록으로 옮겼습니다." : "자료를 복원했습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <div><button className="btn btn-ghost" type="button" disabled={busy} onClick={() => void change()}>{active ? "자료 삭제" : "자료 복원"}</button>{message && <p role="status">{message}</p>}</div>;
}
