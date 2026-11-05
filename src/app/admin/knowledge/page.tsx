import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { KnowledgeForm } from "../../../components/KnowledgeForm";
import { listKnowledge } from "../../../db/store";
import { KnowledgeStatusButton } from "../../../components/KnowledgeStatusButton";
import { PageHeader } from "../../../components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const entries = await listKnowledge();

  return (
    <>
      <PageHeader eyebrow="관리" title="학과·입시 정보">입시요강 PDF를 등록하면 내용을 추출해 답변 작성 자료로 저장합니다. 답변을 게시하기 전에 모집 연도와 내용을 확인해 주세요.</PageHeader>

      <section className="panel">
        <h2>자료 등록</h2>
        <KnowledgeForm />
      </section>

      <section className="panel">
        <h2>등록된 정보</h2>
        <p className="muted">자료의 추출 내용을 검토할 수 있습니다. 새 파일로 바꾸려면 기존 자료를 삭제하고 새 PDF를 등록하세요. 삭제한 자료는 복원할 수 있습니다.</p>
        <div className="knowledge-list">
          {entries.length === 0 && <p className="muted">등록된 자료가 없습니다.</p>}
          {entries.sort((a, b) => Number(b.isActive) - Number(a.isActive)).map((k) => (
            <article key={k.id} className="knowledge-item">
              <h3>
                {k.title} <span className="badge">{k.category}</span>
              </h3>
              {k.departmentName && k.departmentName !== k.title && <p className="muted">학과: {k.departmentName}</p>}
              <p className="muted" style={{ marginTop: 0 }}>
                {k.revisionLabel ?? "—"} · 갱신{" "}
                {new Date(k.updatedAt).toLocaleDateString("ko-KR")}
                {k.isActive ? " · 답변 검색에 사용 중" : " · 삭제됨 (검색 제외)"}
              </p>
              <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{k.body}</p>
              {k.summary && <><h4>AI 정리 내용</h4><p style={{ whiteSpace: "pre-wrap" }}>{k.summary}</p></>}
              {k.sections?.length ? <p className="muted">PDF 검색 구간 {k.sections.length}개</p> : null}
              {k.sections?.length ? <details><summary>추출 내용 검토</summary><p className="muted">PDF에서 읽은 내용을 구간별로 보여 줍니다. 겹치는 문장이 있을 수 있습니다.</p>{k.sections.map((section, i) => <details key={i}><summary>구간 {i + 1}</summary><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{section.text}</p></details>)}</details> : null}
              {!k.embedding && !k.sections?.length && <p className="muted">기존 자료: AI 검색 정보가 없습니다. 새로 등록해 주세요.</p>}
              {k.images?.length ? <p className="muted">첨부 사진 {k.images.length}장 보관됨</p> : null}
              {k.images?.map((_, i) => <p key={i}><a href={`/api/knowledge/image?id=${encodeURIComponent(k.id)}&index=${i}`} target="_blank" rel="noopener noreferrer">첨부 사진 {i + 1} 보기</a></p>)}
              <KnowledgeStatusButton id={k.id} title={k.title} active={k.isActive} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
