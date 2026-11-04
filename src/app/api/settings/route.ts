import { validSnapshotTtl } from "../../../config/tos";
import { isSafeMutation } from "../../../auth/csrf";
import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "../../../auth/session";
import {
  ENABLED_PLATFORMS_KEY,
  PLATFORM_CATALOG,
  PLATFORM_CATALOG_NOTE,
} from "../../../config/platforms";
import {
  getSettings,
  savePlatforms,
  saveTosSettings,
} from "../../../db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireRole(["admin"]))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({
    tos_mode: settings.tos_mode,
    snapshot_ttl_days: settings.snapshot_ttl_days,
    google_enabled: settings.google_enabled,
    kin_auto_post: false,
    [ENABLED_PLATFORMS_KEY]: {
      enabled: settings.enabled_platforms,
      updatedAt: settings.updatedAt,
    },
    platform_catalog: PLATFORM_CATALOG,
    platform_note: PLATFORM_CATALOG_NOTE,
    env_hint: `ENABLED_PLATFORMS=${settings.enabled_platforms.join(",")}`,
    storage: "postgresql",
  });
}

export async function POST(req: NextRequest) {
  if (!isSafeMutation(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = await requireRole(["admin"]);
  if (!admin) return NextResponse.json({ ok: false, error: "admin required" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let enabled: string[] | undefined;
  let tos_mode: string | undefined;
  let snapshot_ttl_days: number | undefined;
  let google_enabled: boolean | undefined;
  let section = "platforms";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      enabled_platforms?: string[];
      tos_mode?: string;
      snapshot_ttl_days?: number;
      google_enabled?: boolean;
      settings_section?: string;
    };
    enabled = body.enabled_platforms;
    tos_mode = body.tos_mode;
    snapshot_ttl_days = body.snapshot_ttl_days;
    google_enabled = body.google_enabled;
    section = body.settings_section ?? "platforms";
  } else {
    const fd = await req.formData();
    section = String(fd.get("settings_section") ?? "platforms");
    enabled = fd
      .getAll("enabled_platforms")
      .map((v) => String(v))
      .filter(Boolean);
    tos_mode = String(fd.get("tos_mode") ?? "") || undefined;
    const ttl = fd.get("snapshot_ttl_days");
    if (ttl != null) snapshot_ttl_days = Number(ttl);
    const g = fd.get("google_enabled");
    if (g != null) google_enabled = String(g) === "true";
  }

  let settings;
  if (section === "tos") {
    if ((snapshot_ttl_days !== undefined && !validSnapshotTtl(snapshot_ttl_days)) || (tos_mode !== undefined && tos_mode !== "derived_meta") || google_enabled === true) return NextResponse.json({ ok: false, error: "보존기간은 1~21일이어야 하며 미지원 수집 기능은 활성화할 수 없습니다." }, { status: 400 });
    settings = await saveTosSettings({
      tos_mode,
      snapshot_ttl_days,
      google_enabled,
    });
  } else {
    if (!Array.isArray(enabled) || enabled.some(id => typeof id !== "string")) {
      return NextResponse.json(
        { ok: false, error: "enabled_platforms required" },
        { status: 400 },
      );
    }
    // Validate against catalog ids
    const allowedIds = new Set(["naver_web", "daum_web"]);
    const filtered = enabled.filter((id) => allowedIds.has(id));
    settings = await savePlatforms(filtered);
  }

  return NextResponse.json({
    ok: true,
    kin_auto_post: false,
    [ENABLED_PLATFORMS_KEY]: {
      enabled: settings.enabled_platforms,
      updatedAt: settings.updatedAt,
    },
    tos_mode: settings.tos_mode,
    snapshot_ttl_days: settings.snapshot_ttl_days,
    google_enabled: settings.google_enabled,
    note: "설정 저장됨 — 수집 registry는 체크된 플랫폼만 사용",
  });
}
