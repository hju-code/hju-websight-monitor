import { redirect } from "next/navigation";
import { requireRole } from "../../auth/session";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireRole(["admin", "assignee"]))) redirect("/login");
  return children;
}
