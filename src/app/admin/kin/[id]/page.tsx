import Link from "next/link";
import { requireRole } from "../../../../auth/session";
import { redirect } from "next/navigation";
import { KinReviewSplit } from "../../../../components/KinReviewSplit";
import { PageHeader } from "../../../../components/PageHeader";
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
      <PageHeader eyebrow="관리 · 지식iN 감지" title="질문 검토">답변을 작성해 검토한 뒤 네이버에서 직접 게시합니다. 자동 게시는 하지 않습니다.</PageHeader>
      <KinReviewSplit question={question} departments={departments} />
    </>
  );
}
