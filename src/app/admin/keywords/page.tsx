import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { KeywordForm } from "../../../components/KeywordForm";
import { listAssignees, listKeywordsFromStore } from "../../../db/store";

export const dynamic = "force-dynamic";

export default async function AdminKeywordsPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const keywords = await listKeywordsFromStore();
  const assignments = await listAssignees();

  return (
    <>
      <p className="page-lead">
        <strong>검색 키워드 관리</strong> — SERP·지식iN 감지에 쓰는 키워드를
        추가·수정·비활성화합니다. 키워드(또는 사이트)별로 답변 담당자를 지정합니다.
      </p>

      <section className="panel">
        <h2>키워드</h2>
        <table>
          <thead>
            <tr>
              <th>구문</th>
              <th>brand</th>
              <th>담당자 이메일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((k) => {
              const asg = assignments.filter(
                (a) => a.keywordPhrase === k.phrase,
              );
              return (
                <tr key={k.id}>
                  <td>{k.phrase}</td>
                  <td>{String(k.is_brand)}</td>
                  <td className="muted">
                    {asg.length
                      ? asg.map((a) => a.assigneeEmail).join(", ")
                      : "미지정"}
                  </td>
                  <td>
                    <a href="/admin/assignees">담당 지정</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted" style={{ marginBottom: 0, marginTop: "1rem" }}>
          별칭 해전대=혜전대는 매칭 레이어에서 처리합니다.
        </p>
      </section>

      <section className="panel">
        <h2>키워드 추가</h2>
        <KeywordForm />
      </section>
    </>
  );
}
