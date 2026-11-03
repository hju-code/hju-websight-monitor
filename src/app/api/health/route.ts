import { NextResponse } from "next/server";
import { loadAppEnv } from "../../../config/env";
import { loadTosPolicy } from "../../../config/tos";
import { getEnabledPlatforms, getSettings } from "../../../db/store";
import {
  getLastPersistError,
  storeIsEphemeral,
  storePath,
} from "../../../db/file-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = loadAppEnv();
  const tos = loadTosPolicy();
  const settings = await getSettings();
  const enabled = await getEnabledPlatforms();
  return NextResponse.json({
    ok: true,
    app: "hju-websight-monitor",
    school: "혜전대학교",
    tos,
    googleEnabled: env.googleEnabled || settings.google_enabled,
    dbConfigured: Boolean(env.databaseUrl),
    dbSchema: env.dbSchema,
    storageFallback: storePath(),
    storageEphemeral: storeIsEphemeral(),
    storagePersistError: getLastPersistError(),
    naverConfigured: Boolean(
      process.env.NAVER_CLIENT_ID?.trim() &&
        process.env.NAVER_CLIENT_SECRET?.trim(),
    ),
    enabledPlatforms: enabled,
    kinAutoPost: false,
  });
}
