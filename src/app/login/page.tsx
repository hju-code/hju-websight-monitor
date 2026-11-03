import { LoginForm } from "../../components/LoginForm";
import { getCurrentUser } from "../../auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  return (
    <>
      <p className="page-lead">
        담당자는 <strong>등록된 본인 이메일</strong>로 로그인합니다. (매직링크 ·
        전략 B). 관리자와 담당자 세션이 분리됩니다.
      </p>
      <section className="panel">
        <h2>이메일 로그인</h2>
        {user ? (
          <p className="muted">
            현재 세션: <strong>{user.email}</strong> ({user.role}) →{" "}
            <a href={user.role === "admin" ? "/admin" : "/review"}>바로가기</a>
          </p>
        ) : null}
        <LoginForm />
      </section>
    </>
  );
}
