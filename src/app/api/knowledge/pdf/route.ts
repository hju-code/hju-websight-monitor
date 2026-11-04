import { NextRequest, NextResponse } from "next/server";
import { isSafeMutation } from "../../../../auth/csrf";
import { requireRole } from "../../../../auth/session";
import { createKnowledge } from "../../../../db/store";
import { aiConfig, embedBatch } from "../../../../kin/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length") || 0) > 4 * 1024 * 1024) return NextResponse.json({ error: "추출한 내용이 너무 깁니다. PDF를 나누어 올려 주세요." }, { status: 413 });
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 415 });
    const input = await req.json() as { name?: unknown; sections?: unknown; emptyPages?: unknown };
    if (typeof input.name !== "string" || !Array.isArray(input.sections) || !input.sections.length || input.sections.length > 300 || !Number.isInteger(input.emptyPages) || Number(input.emptyPages) < 0 || Number(input.emptyPages) > 150) return NextResponse.json({ error: "PDF에서 추출한 내용을 확인해 주세요." }, { status: 400 });
    const parts = input.sections as { page?: unknown; text?: unknown }[];
    if (parts.some(p => !p || !Number.isInteger(p.page) || Number(p.page) < 1 || Number(p.page) > 150 || typeof p.text !== "string" || p.text.length < 20 || p.text.length > 2100)) return NextResponse.json({ error: "PDF에서 추출한 내용을 확인해 주세요." }, { status: 400 });
    const name = input.name.replace(/[\x00-\x1f/\\]/g, "").slice(0, 160) || "입시요강.pdf";
    const extracted = { sections: parts as { page: number; text: string }[], emptyPages: Number(input.emptyPages) };
    const config = aiConfig();
    const vectors = await embedBatch(extracted.sections.map(part => `${name}\n${part.text}`), config);
    const sections = extracted.sections.map((part, i) => ({ ...part, embedding: vectors[i] }));
    const body = `PDF에서 ${sections.length}개 문서 구간을 추출했습니다.${extracted.emptyPages ? ` 글자가 거의 없는 ${extracted.emptyPages}쪽은 내용이 누락됐을 수 있습니다.` : ""}`;
    const entry = await createKnowledge({ category: "admission", title: name, body, sourceFileName: name, sections, embeddingModel: config.embeddingModel });
    return NextResponse.json({ ok: true, id: entry.id, sectionCount: sections.length, emptyPages: extracted.emptyPages });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "PDF 처리에 실패했습니다." }, { status: 400 }); }
}
