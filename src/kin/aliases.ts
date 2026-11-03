/**
 * School name aliases for Kin detection / admin knowledge.
 * Canonical: 혜전대학교 (Hyejeon). Alias: 해전대 (common misspelling).
 * NEVER confuse with 대전대 / 대전대학교 (Daejeon) — excluded.
 */
export const SCHOOL_NAME_ALIASES = [
  "혜전대학교",
  "혜전대",
  "해전대학교", // misspelling → 혜전대
  "해전대",
  "Hyejeon University",
  "Hyejeon Univ",
] as const;

/** Explicit non-matches (wrong school). */
export const EXCLUDED_SCHOOL_FRAGMENTS = [
  "대전대학교",
  "대전대",
  "Daejeon University",
  "한림대학교",
  "한림대",
  "Hallym",
] as const;

export const CANONICAL_SCHOOL_NAME = "혜전대학교";

/** Normalize known misspellings before match / display. */
export function normalizeSchoolMention(text: string): string {
  return text
    .replace(/해전대학교/g, "혜전대학교")
    .replace(/해전대/g, "혜전대");
}

export function mentionsHyejeon(text: string): boolean {
  if (EXCLUDED_SCHOOL_FRAGMENTS.some((frag) => text.includes(frag))) {
    // If only 대전대 etc. without 혜/해전대, reject; if both, still require positive alias
  }
  const n = normalizeSchoolMention(text);
  const positive =
    SCHOOL_NAME_ALIASES.some((a) => {
      if (a.startsWith("해")) return false;
      return n.includes(a);
    }) || /해전대/.test(text);

  if (!positive) return false;
  // Pure 대전대 hit without 혜전/해전 → false (already handled by positive)
  if (/대전대/.test(text) && !/혜전대|해전대|혜전대학교|해전대학교/.test(text)) {
    return false;
  }
  return true;
}
