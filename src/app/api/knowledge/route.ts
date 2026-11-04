import { isSafeMutation } from "../../../auth/csrf";
import { requireRole } from "../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { createKnowledge, listKnowledge, setKnowledgeActive } from "../../../db/store";
import type { KnowledgeCategory } from "../../../kin/types";
import { prepareKnowledge } from "../../../kin/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const entries = await listKnowledge();
  return NextResponse.json({
    source: "storage",
    entries,
    autoPostEnabled: false,
  });
}

export async function PATCH(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "unsupported" }, { status: 415 });
  const body = await req.json().catch(() => null) as { id?: unknown; active?: unknown } | null;
  if (!body || typeof body.id !== "string" || body.id.length > 100 || typeof body.active !== "boolean") return NextResponse.json({ error: "요청을 확인해 주세요." }, { status: 400 });
  try {
    const ok = await setKnowledgeActive(body.id, body.active);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch { return NextResponse.json({ error: "자료 상태를 변경하지 못했습니다." }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length") || 0) > 2 * 1024 * 1024) return NextResponse.json({ ok: false, error: "첨부 파일 크기가 너무 큽니다." }, { status: 413 });
  const contentType = req.headers.get("content-type") || "";
  let category: KnowledgeCategory = "other";
  let title = "";
  let body = "";
  let revisionLabel = "";
  let departmentName = "";
  const images: { type: string; data: string }[] = [];

  if (contentType.includes("application/json")) {
    const json = (await req.json()) as {
      category?: KnowledgeCategory;
      title?: string;
      body?: string;
      revisionLabel?: string;
      revision?: string;
      departmentName?: string;
    };
    category = typeof json.category === "string" ? json.category : "other";
    title = typeof json.title === "string" ? json.title : "";
    body = typeof json.body === "string" ? json.body : "";
    revisionLabel = typeof json.revisionLabel === "string" ? json.revisionLabel : typeof json.revision === "string" ? json.revision : "";
    departmentName = typeof json.departmentName === "string" ? json.departmentName.trim() : "";
  } else {
    const fd = await req.formData();
    category = String(fd.get("category") ?? "other") as KnowledgeCategory;
    title = String(fd.get("title") ?? "");
    body = String(fd.get("body") ?? "");
    revisionLabel = String(fd.get("revision") ?? fd.get("revisionLabel") ?? "");
    departmentName = String(fd.get("departmentName") ?? "").trim();
    const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 2 || files.some(f => f.size > 750 * 1024)) return NextResponse.json({ ok: false, error: "사진은 최대 2장, 각 750KB까지 첨부할 수 있습니다." }, { status: 400 });
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const jpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const png = bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      if (!jpg && !png) return NextResponse.json({ ok: false, error: "JPG 또는 PNG 사진만 첨부할 수 있습니다." }, { status: 400 });
      images.push({ type: jpg ? "image/jpeg" : "image/png", data: bytes.toString("base64") });
    }
  }

  if (category === "department") {
    if (!departmentName || departmentName.length > 100) return NextResponse.json({ ok: false, error: "학과명을 입력해 주세요." }, { status: 400 });
    title = departmentName;
  }
  if (!title.trim() || !body.trim()) {
    return NextResponse.json(
      { ok: false, error: "title and body required", autoPostEnabled: false },
      { status: 400 },
    );
  }

  if (title.length > 200 || body.length > 20000 || revisionLabel.length > 100 || !["department", "admission", "tuition", "campus", "other"].includes(category)) return NextResponse.json({ ok: false, error: "입력 내용이 너무 길거나 구분이 올바르지 않습니다." }, { status: 400 });

  let prepared;
  try { prepared = await prepareKnowledge(title, body, images); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "자료를 정리하지 못했습니다." }, { status: 503 }); }

  const entry = await createKnowledge({
    category,
    title,
    body,
    revisionLabel: revisionLabel || undefined,
    departmentName: category === "department" ? departmentName : undefined,
    ...prepared,
    images,
  });

  return NextResponse.json({
    ok: true,
    entry,
    autoPostEnabled: false,
  });
}
