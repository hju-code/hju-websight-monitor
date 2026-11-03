/** URL / domain normalization for ToS-safe matched_url + matched_domain. */

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    // Drop common tracking params
    for (const key of [...u.searchParams.keys()]) {
      if (
        key.toLowerCase().startsWith("utm_") ||
        key === "fbclid" ||
        key === "gclid"
      ) {
        u.searchParams.delete(key);
      }
    }
    let href = u.toString();
    if (href.endsWith("/") && u.pathname === "/") {
      // keep trailing slash on origin-only
    } else if (href.endsWith("/")) {
      href = href.slice(0, -1);
    }
    return href;
  } catch {
    return raw.trim();
  }
}

export function extractDomain(raw: string): string | null {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

export function isHjDomain(domain: string | null): boolean {
  if (!domain) return false;
  return domain === "hj.ac.kr" || domain.endsWith(".hj.ac.kr");
}
