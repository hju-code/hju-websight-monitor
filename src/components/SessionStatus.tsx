"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SessionStatus({ initialExpiry }: { initialExpiry: string }) {
  const [expiry, setExpiry] = useState(initialExpiry);
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => { const tick = () => setNow(Date.now()); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => void (async () => {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const result = await response.json();
        if (cancelled) return;
        if (result.authenticated && result.expiresAt && Date.parse(result.expiresAt) > Date.now()) setExpiry(result.expiresAt);
        else { router.replace("/login?expired=1"); router.refresh(); }
      } catch { if (!cancelled) { router.replace("/login?expired=1"); router.refresh(); } }
    })(), Math.max(0, Date.parse(expiry) - Date.now()));
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [expiry, router]);
  async function refresh() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "PATCH" });
      const result = await response.json();
      if (response.status === 401) { router.replace("/login?expired=1"); router.refresh(); return; }
      if (!response.ok) throw new Error(result.error || "시간을 연장하지 못했습니다.");
      setExpiry(result.expiresAt); setNow(Date.now());
    } catch (err) { setError(err instanceof Error ? err.message : "시간을 연장하지 못했습니다."); } finally { setBusy(false); }
  }
  const seconds = now === null ? null : Math.max(0, Math.ceil((Date.parse(expiry) - now) / 1000));
  return <span className="session-status"><span>남은 시간 {seconds === null ? "--:--" : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}</span><button type="button" className="nav-button" onClick={() => void refresh()} disabled={busy}>시간 연장</button>{error && <span role="status">{error}</span>}</span>;
}
