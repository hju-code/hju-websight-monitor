import { redirect } from "next/navigation";
import { requireRole } from "../../auth/session";
import { AdminTabs } from "../../components/AdminTabs";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireRole(["admin"]))) redirect("/login");
  return <><AdminTabs />{children}</>;
}
