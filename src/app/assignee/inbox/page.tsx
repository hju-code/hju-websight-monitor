import { redirect } from "next/navigation";

/** Canonical assignee area is /review */
export default function AssigneeInboxRedirect() {
  redirect("/review");
}
