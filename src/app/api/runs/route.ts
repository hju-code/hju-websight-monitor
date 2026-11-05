import { withCollectionLock } from "../../../jobs/exclusive";
import { isSafeMutation } from "../../../auth/csrf";
import { requireRole } from "../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { runCollectJob } from "../../../jobs/collect-run";
import { cooldownRemaining } from "../../../jobs/kin-detect";
import { getLastCollectionRun } from "../../../db/repository";
import { MANUAL_COLLECT_COOLDOWN_MINUTES } from "../../../config/schedule";
import {
  getLastPersistError,
  storeIsEphemeral,
  storePath,
} from "../../../db/file-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** Admins and assignees may run a full manual collection; dry runs and single-keyword runs stay admin-only. */
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const user = await requireRole(["admin", "assignee"]);
  if (!user) return unauthorized();

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if ((dry || q) && user.role !== "admin") return NextResponse.json({ ok: false, error: "관리자만 사용할 수 있는 옵션입니다." }, { status: 403 });
  const keywords = q ? [q] : undefined;
  try {
    const locked = await withCollectionLock(async () => {
      const retryAfterMinutes = cooldownRemaining(await getLastCollectionRun(), MANUAL_COLLECT_COOLDOWN_MINUTES);
      if (retryAfterMinutes) return { kind: "cooldown" as const, minutes: retryAfterMinutes };
      return { kind: "done" as const, out: await runCollectJob({ persist: !dry, triggeredBy: "manual", keywords }) };
    });
    if (!locked.acquired || !locked.value) return NextResponse.json({ ok: false, error: "이미 수집 중입니다. 잠시 후 다시 시도해 주세요." }, { status: 409 });
    if (locked.value.kind === "cooldown") return NextResponse.json({ ok: false, error: `최근 수집 결과가 있습니다. ${locked.value.minutes}분 후 다시 시도해 주세요.` }, { status: 429, headers: { "retry-after": String(locked.value.minutes * 60) } });
    return NextResponse.json({
      ok: true,
      dry,
      storePath: storePath(),
      storeEphemeral: storeIsEphemeral(),
      persistError: getLastPersistError(),
      ...locked.value.out,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "수집을 완료하지 못했습니다." },
      { status: 500 },
    );
  }
}
