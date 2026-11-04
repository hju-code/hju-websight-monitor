"use client";

import { useState } from "react";
import { PlatformCheckboxGroup } from "./PlatformCheckboxGroup";
import type { EnabledPlatformsSetting } from "../config/platforms";

export function SettingsPlatformForm(props: {
  initial: EnabledPlatformsSetting;
}) {
  const [value, setValue] = useState(props.initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const enabled = fd.getAll("enabled_platforms").map(String);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings_section: "platforms",
        enabled_platforms: enabled,
      }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      enabled_platforms?: EnabledPlatformsSetting;
    };
    setBusy(false);
    if (!res.ok || !json.ok) {
      setMsg(json.error ?? "저장 실패");
      return;
    }
    if (json.enabled_platforms) setValue(json.enabled_platforms);
    setMsg(`저장됨: ${(json.enabled_platforms?.enabled ?? enabled).join(", ")}`);
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <PlatformCheckboxGroup value={value} />
      <input type="hidden" name="settings_section" value="platforms" />
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "저장 중…" : "플랫폼 설정 저장"}
        </button>
        {msg ? <span className="muted">{msg}</span> : null}
      </div>
    </form>
  );
}

export function SettingsTosForm(props: {
  tosMode: string;
  ttl: number;
  googleEnabled: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings_section: "tos",
        tos_mode: String(fd.get("tos_mode")),
        snapshot_ttl_days: Number(fd.get("snapshot_ttl_days")),
        google_enabled: String(fd.get("google_enabled")) === "true",
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    setMsg(json.ok ? "ToS·TTL 설정 저장됨" : json.error ?? "실패");
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="tos">TOS_MODE</label>
          <select id="tos" name="tos_mode" defaultValue={props.tosMode}>
            <option value="derived_meta">derived_meta (원문 미저장)</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="ttl">검색 결과 보관 기간 (일)</label>
          <input
            id="ttl"
            name="snapshot_ttl_days"
            type="number" min={1} max={21} step={1}
            defaultValue={props.ttl}
          />
        </div>
        <div className="form-row">
          <label htmlFor="google">Google PSE</label>
          <select
            id="google"
            name="google_enabled"
            defaultValue={props.googleEnabled ? "true" : "false"}
          >
            <option value="false">보류 (false)</option>
            <option value="true" disabled>활성화 준비 중</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="autopost">지식iN 자동 게시</label>
          <select id="autopost" name="kin_auto_post" defaultValue="false" disabled>
            <option value="false">끔 — 변경 불가</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "저장 중…" : "설정 저장"}
      </button>
      {msg ? <p className="muted">{msg}</p> : null}
    </form>
  );
}
