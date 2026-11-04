export function safeNaverQuestionUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return undefined;
    if (url.hostname !== "kin.naver.com" && !(url.hostname === "openapi.naver.com" && url.pathname === "/l")) return undefined;
    return url.href;
  } catch { return undefined; }
}
