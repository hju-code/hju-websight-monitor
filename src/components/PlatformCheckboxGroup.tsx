import {
  PLATFORM_CATALOG_NOTE,
  defaultEnabledPlatforms,
  platformsByTier,
  type EnabledPlatformsSetting,
  type PlatformOption,
  type PlatformTier,
} from "../config/platforms";

const TIER_META: Record<
  PlatformTier,
  { title: string; badgeClass: string; blurb: string }
> = {
  active: {
    title: "활성 (켜도 됨)",
    badgeClass: "ok",
    blurb: "네이버·다음 웹, 유튜브 — 주기 수집 대상으로 켜둘 수 있습니다.",
  },
  conditional: {
    title: "조건부",
    badgeClass: "warn",
    blurb: "체크 가능하나 제한이 있습니다. 제한 문구를 확인하세요.",
  },
  not_recommended: {
    title: "비권장",
    badgeClass: "warn",
    blurb: "기본 체크 해제. 운영 목적 데이터 접근이 어렵습니다.",
  },
};

function PlatformList(props: {
  name: string;
  items: PlatformOption[];
  enabled: Set<string>;
  tier: PlatformTier;
}) {
  const meta = TIER_META[props.tier];
  if (props.items.length === 0) return null;
  return (
    <div className="platform-group">
      <h3 className="platform-group-title">{meta.title}</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        {meta.blurb}
      </p>
      <ul className="platform-checks">
        {props.items.map((p) => (
          <li key={p.id}>
            <label className="platform-check">
              <input
                type="checkbox"
                name={props.name}
                value={p.id}
                defaultChecked={props.enabled.has(p.id)}
              />
              <span>{p.label}</span>
              <span className={`badge ${meta.badgeClass}`}>
                {p.restrictionLabel}
              </span>
            </label>
            {p.notes ? (
              <span className="muted platform-note">{p.notes}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Admin UI: platform tiers from expansion research.
 * Saves via form → enabled_platforms settings. No auto-post.
 */
export function PlatformCheckboxGroup(props: {
  value?: EnabledPlatformsSetting;
  name?: string;
}) {
  const name = props.name ?? "enabled_platforms";
  const enabled = new Set(
    (props.value ?? defaultEnabledPlatforms()).enabled,
  );

  return (
    <fieldset className="platform-fieldset">
      <legend>수집·노출 조회 플랫폼 (혜전대학교)</legend>
      <p className="muted" style={{ marginTop: 0 }}>
        체크된 항목만 노출 건수 조회/주기 수집 대상입니다. 설정으로 저장됩니다.
      </p>

      <PlatformList
        name={name}
        tier="active"
        items={platformsByTier("active")}
        enabled={enabled}
      />
      <PlatformList
        name={name}
        tier="conditional"
        items={platformsByTier("conditional")}
        enabled={enabled}
      />
      <PlatformList
        name={name}
        tier="not_recommended"
        items={platformsByTier("not_recommended")}
        enabled={enabled}
      />

      <p className="muted notice-nopost" style={{ marginBottom: 0 }}>
        {PLATFORM_CATALOG_NOTE}
      </p>
    </fieldset>
  );
}
