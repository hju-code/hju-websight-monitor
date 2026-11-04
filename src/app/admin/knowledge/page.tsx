import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { KnowledgeForm } from "../../../components/KnowledgeForm";
import { listKnowledge } from "../../../db/store";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const entries = await listKnowledge();

  return (
    <>
      <p className="page-lead">
        학교 자료와 사진을 등록하면 GPT가 주요 내용을 정리하고 검색용 정보로 저장합니다. 생성된 정리 내용은 반드시 원본과 비교해 확인해 주세요.
      </p>

      <section className="panel">
        <h2>정보 입력</h2>
        <KnowledgeForm />
      </section>

      <section className="panel">
        <h2>등록된 정보</h2>
        <p className="muted">수정이 쉽도록 목록에서 항목을 바로 확인합니다.</p>
        <div className="knowledge-list">
          {entries.map((k) => (
            <article key={k.id} className="knowledge-item">
              <h3>
                {k.title} <span className="badge">{k.category}</span>
              </h3>
              <p className="muted" style={{ marginTop: 0 }}>
                {k.revisionLabel ?? "—"} · 갱신{" "}
                {new Date(k.updatedAt).toLocaleDateString("ko-KR")}
              </p>
              <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{k.body}</p>
              {k.summary && <><h4>AI 정리 내용</h4><p style={{ whiteSpace: "pre-wrap" }}>{k.summary}</p></>}
              {!k.embedding && <p className="muted">기존 자료: AI 검색 정보가 없습니다. 새로 등록해 주세요.</p>}
              {k.images?.length ? <p className="muted">첨부 사진 {k.images.length}장 보관됨</p> : null}
              {k.images?.map((_, i) => <p key={i}><a href={`/api/knowledge/image?id=${encodeURIComponent(k.id)}&index=${i}`} target="_blank" rel="noopener noreferrer">첨부 사진 {i + 1} 보기</a></p>)}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
