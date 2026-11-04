import { LoginForm } from "../../components/LoginForm";
export default function LoginPage() {
  return <section className="panel"><h2>로그인</h2><p className="muted">관리자와 사용자는 등록된 이메일과 비밀번호를 사용합니다.</p><LoginForm /></section>;
}
