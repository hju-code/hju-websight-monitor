"use client";
import { useState } from "react";
import Link from "next/link";

type Row = { id: string; title: string; markedAt?: string; markedBy?: string };
export function NotNeededHistory({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const shown = rows.filter(row => `${row.title} ${row.markedBy ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="panel"><h2>답변 필요없는 질문</h2><p className="muted">질문 제목을 누르면 표시를 해제하고 다시 검토할 수 있습니다. 답변 내용은 저장하지 않습니다.</p>
    <div className="history-toolbar"><label htmlFor="skipped-search">제목 또는 표시자 검색</label><input id="skipped-search" type="search" value={query} onChange={event => setQuery(event.target.value)} /><span className="muted">총 {shown.length}건</span></div>
    <div className="table-scroll"><table><thead><tr><th>질문</th><th>구분</th><th>표시한 계정</th><th>표시 시간</th></tr></thead><tbody>
      {shown.length === 0 ? <tr><td colSpan={4}>표시된 질문이 없습니다.</td></tr> : shown.map(row => <tr key={row.id}><td><Link href={`/review/${encodeURIComponent(row.id)}`}>{row.title}</Link></td><td>답변 필요없음</td><td>{row.markedBy ?? "기록 없음"}</td><td>{row.markedAt ? new Date(row.markedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "기록 없음"}</td></tr>)}
    </tbody></table></div></section>;
}
