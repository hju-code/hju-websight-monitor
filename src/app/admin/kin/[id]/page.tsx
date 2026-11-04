import Link from "next/link";
import { requireRole } from "../../../../auth/session";
import { redirect } from "next/navigation";
import { KinReviewSplit } from "../../../../components/KinReviewSplit";
import {
  getQuestion,
  listKnowledge,
} from "../../../../db/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminKinDetailPage({ params }: Props) {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) {
    return (
      <section className="panel">
        <p>
          질문 없음. <Link href="/admin/kin">목록</Link>
        </p>
      </section>
    );
  }
  const departments = [...new Set((await listKnowledge()).filter(k => k.isActive && k.category === "department" && k.departmentName && k.embedding?.length).map(k => k.departmentName!))].sort((a, b) => a.localeCompare(b, "ko"));
  return (
    <>
      <p className="page-lead">
        관리자 검토 — 혜전대학교 지식iN. <strong>자동 게시 금지.</strong>
      </p>
      <KinReviewSplit question={question} departments={departments} />
    </>
  );
}
