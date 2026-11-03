import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Canonical path: /review/[id] */
export default async function AssigneeReviewRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/review/${id}`);
}
