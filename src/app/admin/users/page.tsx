import { getAuthService, requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";
import { UserManagement } from "../../../components/UserManagement";
export const dynamic = "force-dynamic";
export default async function UsersPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  return <><p className="page-lead">사용자 계정을 관리합니다.</p><UserManagement users={await getAuthService().listUsers()} /></>;
}
