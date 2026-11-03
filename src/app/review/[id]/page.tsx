import { KinReviewSplit } from "../../../components/KinReviewSplit";
import {
  getDraftForQuestion,
  getQuestion,
} from "../../../db/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewDetailPage({ params }: Props) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) {
    return (
      <section className="panel">
        <p>질문을 찾을 수 없습니다. <a href="/review">목록</a></p>
      </section>
    );
  }
  const draft = await getDraftForQuestion(id);

  return (
    <>
      <p className="page-lead">
        혜전대학교 지식iN 초안 검토 (담당자). 승인 저장 또는 네이버에서 직접
        붙여넣기. <strong>자동 게시 금지.</strong>
      </p>
      <KinReviewSplit question={question} draft={draft} />
    </>
  );
}
