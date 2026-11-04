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
        관리자가 혜전대(해전대=혜전대) <strong>학과·입시 정보</strong>를 직접
        입력하고 매년/주기적으로 갱신합니다. 이 데이터가 지식iN 초안 생성의
        유일한 근거입니다.
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
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
