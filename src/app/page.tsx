import { redirect } from "next/navigation";

/** Public entry → statistics. */
export default function HomePage() {
  redirect("/stats");
}
