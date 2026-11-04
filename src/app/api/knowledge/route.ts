import { isSafeMutation } from "../../../auth/csrf";
import { requireRole } from "../../../auth/session";
import { NextRequest, NextResponse } from "next/server";
import { createKnowledge, listKnowledge } from "../../../db/store";
import type { KnowledgeCategory } from "../../../kin/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const entries = await listKnowledge();
  return NextResponse.json({
    source: "storage",
    entries,
    autoPostEnabled: false,
  });
}

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const contentType = req.headers.get("content-type") || "";
  let category: KnowledgeCategory = "other";
  let title = "";
  let body = "";
  let revisionLabel = "";

  if (contentType.includes("application/json")) {
    const json = (await req.json()) as {
      category?: KnowledgeCategory;
      title?: string;
      body?: string;
      revisionLabel?: string;
      revision?: string;
    };
    category = json.category ?? "other";
    title = json.title ?? "";
    body = json.body ?? "";
    revisionLabel = json.revisionLabel ?? json.revision ?? "";
  } else {
    const fd = await req.formData();
    category = String(fd.get("category") ?? "other") as KnowledgeCategory;
    title = String(fd.get("title") ?? "");
    body = String(fd.get("body") ?? "");
    revisionLabel = String(fd.get("revision") ?? fd.get("revisionLabel") ?? "");
  }

  if (!title.trim() || !body.trim()) {
    return NextResponse.json(
      { ok: false, error: "title and body required", autoPostEnabled: false },
      { status: 400 },
    );
  }

  const entry = await createKnowledge({
    category,
    title,
    body,
    revisionLabel: revisionLabel || undefined,
  });

  return NextResponse.json({
    ok: true,
    entry,
    autoPostEnabled: false,
  });
}
