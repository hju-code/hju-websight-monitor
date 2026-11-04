import { withCollectionLock } from "../../../jobs/exclusive";
import { isSafeMutation } from "../../../auth/csrf";
import { requireRole } from "../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { runCollectJob } from "../../../jobs/collect-run";
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

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return unauthorized();

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const keywords = q ? [q] : undefined;
  try {
    const locked = await withCollectionLock(() => runCollectJob({
      persist: !dry,
      triggeredBy: "manual",
      keywords,
    }));
    if (!locked.acquired || !locked.value) return NextResponse.json({ ok: false, error: "이미 수집 중입니다." }, { status: 409 });
    const out = locked.value;
    return NextResponse.json({
      ok: true,
      dry,
      storePath: storePath(),
      storeEphemeral: storeIsEphemeral(),
      persistError: getLastPersistError(),
      ...out,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "수집을 완료하지 못했습니다." },
      { status: 500 },
    );
  }
}
