"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type HistoryRow = { id: string; title: string; questionUrl?: string; reviewId?: string; body: string; createdAt: string; savedBy?: string; deletedAt?: string };
export function AnswerHistoryTable({ records, email, isAdmin }: { records: HistoryRow[]; email: string; isAdmin: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(""); const [view, setView] = useState<"active" | "deleted">("active");
  const [page, setPage] = useState(0); const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const filtered = useMemo(() => records.filter(r => Boolean(r.deletedAt) === (view === "deleted") && `${r.title} ${r.body} ${r.savedBy || ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [records, query, view]);
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages - 1); const rows = filtered.slice(currentPage * 20, currentPage * 20 + 20);
  const canManage = (r: HistoryRow) => isAdmin || (!r.deletedAt && !!r.savedBy && r.savedBy.trim().toLowerCase() === email.trim().toLowerCase());
  const selectable = rows.filter(canManage).map(r => r.id); const allSelected = selectable.length > 0 && selectable.every(id => selected.includes(id));
  function toggle(id: string) { setSelected(old => old.includes(id) ? old.filter(item => item !== id) : [...old, id]); }
  async function change(ids: string[], action: "delete" | "restore") {
    if (!ids.length || !window.confirm(`${ids.length}개 기록을 ${action === "delete" ? "삭제 목록으로 이동" : "복원"}하시겠습니까?`)) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/kin/history", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids, action }) });
      const result = await res.json();
      if (!res.ok) { setMessage(result.error || "처리하지 못했습니다."); return; }
      setSelected([]); setMessage(action === "delete" ? "선택한 기록을 삭제했습니다." : "선택한 기록을 복원했습니다."); router.refresh();
    } catch { setMessage("서버에 연결하지 못했습니다."); } finally { setBusy(false); }
  }
  return <div className="history-sheet">
    <div className="history-toolbar"><label htmlFor="history-search">기록 검색</label><input id="history-search" type="search" placeholder="질문, 답변, 작성자 검색" value={query} onChange={e => { setQuery(e.target.value); setPage(0); setSelected([]); }} />
      {isAdmin && <select aria-label="기록 상태" value={view} onChange={e => { setView(e.target.value as "active" | "deleted"); setPage(0); setSelected([]); }}><option value="active">저장된 기록</option><option value="deleted">삭제된 기록</option></select>}
      <span className="muted">총 {filtered.length}건</span><button className="btn btn-ghost" type="button" disabled={busy || !selected.length} onClick={() => void change(selected, view === "active" ? "delete" : "restore")}>{view === "active" ? "선택 삭제" : "선택 복원"}{selected.length ? ` (${selected.length})` : ""}</button>
    </div>
    <div className="table-scroll"><table className="history-table"><thead><tr><th><input type="checkbox" aria-label="현재 페이지 전체 선택" checked={allSelected} disabled={!selectable.length || busy} onChange={() => setSelected(old => allSelected ? old.filter(id => !selectable.includes(id)) : [...new Set([...old, ...selectable])].slice(0, 100))} /></th><th>저장일시</th><th>질문</th><th>답변 내용</th><th>작성자</th><th>관리</th></tr></thead><tbody>
      {!rows.length ? <tr><td colSpan={6} className="muted">표시할 기록이 없습니다.</td></tr> : rows.map(r => <tr key={r.id}><td><input type="checkbox" aria-label={`${r.title} 기록 선택`} disabled={!canManage(r) || busy} checked={selected.includes(r.id)} onChange={() => toggle(r.id)} /></td><td className="history-date">{new Date(r.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td><td className="history-title">{r.reviewId ? <Link href={`/review/${encodeURIComponent(r.reviewId)}`}>{r.title}</Link> : r.title}</td><td className="history-body"><div className="history-body-actions"><details><summary>{r.body.replace(/\s+/g, " ").slice(0, 95)}{r.body.length > 95 ? "…" : ""}</summary><p>{r.body}</p></details>{r.questionUrl ? <a className="history-question-link" href={r.questionUrl} target="_blank" rel="noopener noreferrer" aria-label={`${r.title} 네이버 질문 보기 (새 창)`}>네이버 질문 보기 ↗</a> : <span className="muted">질문 링크 없음</span>}</div></td><td className="history-owner">{r.savedBy || "기록 없음"}</td><td>{canManage(r) ? <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void change([r.id], view === "active" ? "delete" : "restore")}>{view === "active" ? "삭제" : "복원"}</button> : <span className="muted">—</span>}</td></tr>)}
    </tbody></table></div>
    <div className="history-pagination"><button className="btn btn-ghost" type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); setSelected([]); }}>이전</button><span>{currentPage + 1} / {pages}</span><button className="btn btn-ghost" type="button" disabled={currentPage >= pages - 1} onClick={() => { setPage(currentPage + 1); setSelected([]); }}>다음</button></div>
    {message && <p role="status">{message}</p>}
  </div>;
}
