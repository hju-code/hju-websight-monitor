import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { AssigneeForm } from "../../../components/AssigneeForm";
import { listAssignees } from "../../../db/store";
import { PageHeader } from "../../../components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminAssigneesPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const assignments = await listAssignees();
  return (
    <>
      <PageHeader eyebrow="관리" title="담당자 배정">사이트·키워드별 답변 담당자를 지정합니다. 담당자는 본인 계정으로 로그인해 배정된 질문만 검토·작성합니다.</PageHeader>

      <section className="panel">
        <h2>담당자 배정</h2>
        <table>
          <thead>
            <tr>
              <th>키워드</th>
              <th>사이트</th>
              <th>이름</th>
              <th>이메일</th>
              <th>활성</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.keywordPhrase}</td>
                <td>
                  <code>{a.siteKey}</code>
                </td>
                <td>{a.assigneeName ?? "—"}</td>
                <td>{a.assigneeEmail}</td>
                <td>
                  <span className={`badge ${a.isActive ? "ok" : "warn"}`}>
                    {a.isActive ? "on" : "off"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>담당자 등록</h2>
        <AssigneeForm />
        <p className="muted notice-nopost" style={{ marginTop: "1rem" }}>
          담당자 권한으로도 네이버 답글 <strong>자동 게시 불가</strong>. 검토·복사·링크
          붙여넣기만 가능합니다.
        </p>
      </section>
    </>
  );
}
