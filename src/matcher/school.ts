import type { OrganicHit } from "../collectors/types";
import { extractDomain, isHjDomain, normalizeUrl } from "./normalize";

export type MatchMode = "domain_or_name" | "name_only" | "domain_only";

export interface SchoolMatchRules {
  /** Official domains: hj.ac.kr and subdomains */
  domains: string[];
  /** Official names / aliases (NOT standalone "HJU") */
  names: string[];
  /** Explicit exclusions (Hallym confusion guard) */
  excludeDomains: string[];
  excludeNameFragments: string[];
  matchMode: MatchMode;
}

export const DEFAULT_SCHOOL_RULES: SchoolMatchRules = {
  domains: ["hj.ac.kr"],
  names: [
    "혜전대학교",
    "혜전대",
    "Hyejeon University",
    "Hyejeon Univ",
  ],
  excludeDomains: ["hallym.ac.kr"],
  excludeNameFragments: ["한림대학교", "한림대", "Hallym"],
  matchMode: "domain_or_name",
};

export interface SchoolMatchResult {
  status: "ok" | "not_found";
  schoolRank: number | null;
  matchedUrl: string | null;
  matchedDomain: string | null;
  matchReason: "domain" | "name" | null;
}

function titleOrSnippetMatchesName(hit: OrganicHit, names: string[]): boolean {
  const hay = `${hit.title} ${hit.snippet ?? ""}`.toLowerCase();
  return names.some((n) => hay.includes(n.toLowerCase()));
}

function isExcluded(hit: OrganicHit, rules: SchoolMatchRules): boolean {
  const domain = extractDomain(hit.url);
  if (domain && rules.excludeDomains.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return true;
  }
  const hay = `${hit.title} ${hit.snippet ?? ""}`;
  return rules.excludeNameFragments.some((frag) => hay.includes(frag));
}

function matchesSchool(hit: OrganicHit, rules: SchoolMatchRules): "domain" | "name" | null {
  if (isExcluded(hit, rules)) return null;

  const domain = extractDomain(hit.url);
  const domainHit =
    isHjDomain(domain) ||
    rules.domains.some((d) => domain === d || (domain?.endsWith(`.${d}`) ?? false));

  const nameHit = titleOrSnippetMatchesName(hit, rules.names);

  switch (rules.matchMode) {
    case "domain_only":
      return domainHit ? "domain" : null;
    case "name_only":
      return nameHit ? "name" : null;
    case "domain_or_name":
    default:
      if (domainHit) return "domain";
      if (nameHit) return "name";
      return null;
  }
}

/**
 * Find the best (lowest) school rank within Top N organic hits.
 * After matching, callers MUST discard title/snippet before DB write.
 */
export function matchSchool(
  hits: OrganicHit[],
  rules: SchoolMatchRules = DEFAULT_SCHOOL_RULES,
): SchoolMatchResult {
  const sorted = [...hits].sort((a, b) => a.rank - b.rank);

  for (const hit of sorted) {
    const reason = matchesSchool(hit, rules);
    if (!reason) continue;
    return {
      status: "ok",
      schoolRank: hit.rank,
      matchedUrl: normalizeUrl(hit.url),
      matchedDomain: extractDomain(hit.url),
      matchReason: reason,
    };
  }

  return {
    status: "not_found",
    schoolRank: null,
    matchedUrl: null,
    matchedDomain: null,
    matchReason: null,
  };
}

/**
 * Strip ephemeral text fields — call before any persistence.
 */
export function toDerivedMeta(match: SchoolMatchResult) {
  return {
    school_rank: match.schoolRank,
    school_status: match.status,
    matched_url: match.matchedUrl,
    matched_domain: match.matchedDomain,
  };
}
