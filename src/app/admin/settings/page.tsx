import {
  AUTH_RECOMMENDATION_NOTE,
  AUTH_STRATEGY_OPTIONS,
  AUTH_STRATEGY_RECOMMENDATION,
} from "../../../auth/types";
import {
  SettingsPlatformForm,
  SettingsTosForm,
} from "../../../components/SettingsPlatformForm";
import { getSettings } from "../../../db/store";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
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

      <section className="panel">
        <h2>로그인 · 계정 전략</h2>
        <p className="muted">{AUTH_RECOMMENDATION_NOTE}</p>
        <table>
          <thead>
            <tr>
              <th>옵션</th>
              <th>장점</th>
              <th>단점</th>
            </tr>
          </thead>
          <tbody>
            {AUTH_STRATEGY_OPTIONS.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.label}
                  {o.id === AUTH_STRATEGY_RECOMMENDATION ? (
                    <>
                      {" "}
                      <span className="badge ok">P1 권고</span>
                    </>
                  ) : null}
                </td>
                <td className="muted">{o.pros.join(" · ")}</td>
                <td className="muted">{o.cons.join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
