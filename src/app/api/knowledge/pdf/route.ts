import { NextRequest, NextResponse } from "next/server";
import { isSafeMutation } from "../../../../auth/csrf";
import { requireRole } from "../../../../auth/session";
import { createKnowledge } from "../../../../db/store";
import { aiConfig, embedBatch } from "../../../../kin/ai";
import { extractPdfSections } from "../../../../kin/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length") || 0) > 4 * 1024 * 1024) return NextResponse.json({ error: "PDF는 4MB 이하로 올려 주세요." }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("pdf");
    if (!(file instanceof File) || !file.size || file.size > 3.5 * 1024 * 1024) return NextResponse.json({ error: "3.5MB 이하의 PDF 한 개를 선택해 주세요." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "올바른 PDF 파일을 선택해 주세요." }, { status: 400 });
    const name = file.name.replace(/[\x00-\x1f/\\]/g, "").slice(0, 160) || "입시요강.pdf";
    const extracted = await extractPdfSections(bytes);
    const config = aiConfig();
    const vectors = await embedBatch(extracted.sections.map(part => `${name}\n${part.text}`), config);
    const sections = extracted.sections.map((part, i) => ({ ...part, embedding: vectors[i] }));
    const body = `PDF에서 ${sections.length}개 문서 구간을 추출했습니다.${extracted.emptyPages ? ` 글자가 거의 없는 ${extracted.emptyPages}쪽은 내용이 누락됐을 수 있습니다.` : ""}`;
    const entry = await createKnowledge({ category: "admission", title: name, body, sourceFileName: name, sections, embeddingModel: config.embeddingModel });
    return NextResponse.json({ ok: true, id: entry.id, sectionCount: sections.length, emptyPages: extracted.emptyPages });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "PDF 처리에 실패했습니다." }, { status: 400 }); }
}
