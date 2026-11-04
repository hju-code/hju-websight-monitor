import Link from "next/link";
import { requireRole } from "../../../auth/session";
import { canAccessQuestion } from "../../../auth/scope";
import { redirect, notFound } from "next/navigation";
import { KinReviewSplit } from "../../../components/KinReviewSplit";
import {
  getQuestion,
  listAssignees,
  listKnowledge,
} from "../../../db/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewDetailPage({ params }: Props) {
  const user = await requireRole(["admin", "assignee"]);
  if (!user) redirect("/login");
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) {
    return (
      <section className="panel">
        <p>질문을 찾을 수 없습니다. <Link href="/review">목록</Link></p>
      </section>
    );
  }
  if (!canAccessQuestion(user, question, await listAssignees())) notFound();
  const departments = [...new Set((await listKnowledge()).filter(k => k.isActive && k.category === "department" && k.departmentName && k.embedding?.length).map(k => k.departmentName!))].sort((a, b) => a.localeCompare(b, "ko"));

  return (
    <>
      <p className="page-lead">
        혜전대학교 지식iN 초안 검토 (담당자). 승인 저장 또는 네이버에서 직접
        붙여넣기. <strong>자동 게시 금지.</strong>
      </p>
      <KinReviewSplit question={question} departments={departments} />
    </>
  );
}
