import { AssigneeForm } from "../../../components/AssigneeForm";
import { listAssignees } from "../../../db/store";

export const dynamic = "force-dynamic";

export default async function AdminAssigneesPage() {
  const assignments = await listAssignees();
  return (
    <>
      <p className="page-lead">
        사이트/키워드별 <strong>답변 담당자</strong>와 <strong>이메일</strong>을
        등록합니다. 담당자는 본인 이메일로 로그인해 배정된 초안만 검토·작성합니다.
      </p>

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
