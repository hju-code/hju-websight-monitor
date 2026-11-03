import { KinReviewSplit } from "../../../../components/KinReviewSplit";
import {
  getDraftForQuestion,
  getQuestion,
} from "../../../../db/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminKinDetailPage({ params }: Props) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) {
    return (
      <section className="panel">
        <p>
          질문 없음. <a href="/admin/kin">목록</a>
        </p>
      </section>
    );
  }
  const draft = await getDraftForQuestion(id);
  return (
    <>
      <p className="page-lead">
        관리자 검토 — 혜전대학교 지식iN. <strong>자동 게시 금지.</strong>
      </p>
      <KinReviewSplit question={question} draft={draft} />
    </>
  );
}
