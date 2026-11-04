import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";

import {
  SettingsPlatformForm,
  SettingsTosForm,
} from "../../../components/SettingsPlatformForm";
import { getSettings } from "../../../db/store";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await requireRole(["admin"]))) redirect("/login");
  const settings = await getSettings();
  const platforms = {
    enabled: settings.enabled_platforms,
    updatedAt: settings.updatedAt,
  };

  return (
    <>
      <p className="page-lead">
        <strong>전체 설정 관리</strong> — 플랫폼 체크·ToS·TTL·인증. 체크된
        플랫폼만 혜전대학교 노출 조회/주기 수집 대상입니다. 답글 자동 게시 없음.
      </p>

      <section className="panel">
        <h2>소셜 · 검색 플랫폼</h2>
        <SettingsPlatformForm initial={platforms} />
      </section>

      <section className="panel">
        <h2>수집 · ToS</h2>
        <SettingsTosForm
          tosMode={settings.tos_mode}
          ttl={settings.snapshot_ttl_days}
          googleEnabled={settings.google_enabled}
        />
      </section>

      <section className="panel"><h2>계정 보안</h2><p>관리자는 사용자 계정을 관리하고 비밀번호를 초기화할 수 있습니다.</p><a href="/admin/users">사용자 계정 관리</a></section>
    </>
  );
}
