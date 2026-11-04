import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../auth/session";
import { listKnowledge } from "../../../../db/store";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  const indexText = req.nextUrl.searchParams.get("index");
  if (!id || !indexText || !/^[01]$/.test(indexText)) return new NextResponse(null, { status: 404 });
  const image = (await listKnowledge()).find(entry => entry.id === id)?.images?.[Number(indexText)];
  if (!image || !["image/jpeg", "image/png"].includes(image.type)) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(Buffer.from(image.data, "base64")), { headers: { "Content-Type": image.type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
