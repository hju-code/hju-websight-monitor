import { getAuthService, requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { UserManagement } from "../../../components/UserManagement";
import { PageHeader } from "../../../components/PageHeader";
export const dynamic = "force-dynamic";
export default async function UsersPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  return <><PageHeader eyebrow="관리" title="사용자">계정을 만들고, 비밀번호를 초기화하거나 사용을 중지합니다.</PageHeader><UserManagement users={await getAuthService().listUsers()} /></>;
}
