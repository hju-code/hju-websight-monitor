import { isSafeMutation } from "../../../auth/csrf";
import { getAuthService, requireRole } from "../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { listAssignees, upsertAssignee } from "../../../db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const assignments = await listAssignees();
  return NextResponse.json({
    source: "storage",
    assignments,
    autoPostEnabled: false,
  });
}

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const contentType = req.headers.get("content-type") || "";
  let keywordPhrase = "";
  let siteKey = "naver-kin";
  let assigneeEmail = "";
  let assigneeName = "";
  let isActive = true;

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      keywordPhrase?: string;
      siteKey?: string;
      assigneeEmail?: string;
      assigneeName?: string;
      isActive?: boolean;
    };
    keywordPhrase = body.keywordPhrase ?? "";
    siteKey = body.siteKey ?? "naver-kin";
    assigneeEmail = body.assigneeEmail ?? "";
    assigneeName = body.assigneeName ?? "";
    isActive = body.isActive ?? true;
  } else {
    const fd = await req.formData();
    keywordPhrase = String(fd.get("keywordPhrase") ?? "");
    siteKey = String(fd.get("siteKey") ?? "naver-kin");
    assigneeEmail = String(fd.get("assigneeEmail") ?? "");
    assigneeName = String(fd.get("assigneeName") ?? "");
    isActive = String(fd.get("isActive") ?? "true") !== "false";
  }

  if (!keywordPhrase.trim() || !assigneeEmail.includes("@")) {
    return NextResponse.json(
      {
        ok: false,
        error: "keywordPhrase and assigneeEmail required",
        autoPostEnabled: false,
      },
      { status: 400 },
    );
  }

  const target = (await getAuthService().listUsers()).find(u => u.email.toLowerCase() === assigneeEmail.trim().toLowerCase() && u.role === "assignee" && u.isActive);
  if (!target) return NextResponse.json({ ok: false, error: "활성 사용자 계정을 먼저 등록해 주세요." }, { status: 400 });

  const assignment = await upsertAssignee({
    keywordPhrase: keywordPhrase.trim(),
    siteKey,
    assigneeEmail: assigneeEmail.trim().toLowerCase(),
    assigneeName: assigneeName.trim() || undefined,
    isActive,
  });

  return NextResponse.json({
    ok: true,
    assignment,
    autoPostEnabled: false,
  });
}
