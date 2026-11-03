import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_STRATEGY_RECOMMENDATION,
  AUTH_RECOMMENDATION_NOTE,
} from "../../../auth/types";
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
  const settings = await getSettings();
  return NextResponse.json({
    tos_mode: settings.tos_mode,
    snapshot_ttl_days: settings.snapshot_ttl_days,
    google_enabled: settings.google_enabled,
    kin_auto_post: false,
    auth_strategy: AUTH_STRATEGY_RECOMMENDATION,
    auth_note: AUTH_RECOMMENDATION_NOTE,
    [ENABLED_PLATFORMS_KEY]: {
      enabled: settings.enabled_platforms,
      updatedAt: settings.updatedAt,
    },
    platform_catalog: PLATFORM_CATALOG,
    platform_note: PLATFORM_CATALOG_NOTE,
    env_hint: `ENABLED_PLATFORMS=${settings.enabled_platforms.join(",")}`,
    storage: "file",
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireRole(["admin"]);
  // Allow cloud preview without session if admin token header matches
  const token = process.env.WEBSIGHT_ADMIN_TOKEN;
  const headerTok = req.headers.get("x-admin-token");
  const allowed =
    Boolean(admin) ||
    (token && headerTok === token) ||
    process.env.WEBSIGHT_DEV_AUTH !== "false";

  if (!allowed) {
    return NextResponse.json({ ok: false, error: "admin required" }, { status: 401 });
  }

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
    settings = await saveTosSettings({
      tos_mode,
      snapshot_ttl_days,
      google_enabled,
    });
  } else {
    if (!enabled) {
      return NextResponse.json(
        { ok: false, error: "enabled_platforms required" },
        { status: 400 },
      );
    }
    // Validate against catalog ids
    const allowedIds = new Set(PLATFORM_CATALOG.map((p) => p.id));
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
