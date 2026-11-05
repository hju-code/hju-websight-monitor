import { requireRole } from "../../../auth/session";
import { redirect } from "next/navigation";

import {
  SettingsPlatformForm,
  SettingsTosForm,
} from "../../../components/SettingsPlatformForm";
import { getSettings } from "../../../db/store";
import { PageHeader } from "../../../components/PageHeader";

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
      <PageHeader eyebrow="관리" title="전체 설정">수집할 검색 플랫폼과 보존 기간을 정합니다. 체크한 플랫폼만 정기 수집 대상이며, 답글 자동 게시는 하지 않습니다.</PageHeader>

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
