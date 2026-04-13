import {
  normalizeStoredSearchResults,
  type StoredSearchResultItem,
} from "@cause/types";

export const MAX_CRAWL_CANDIDATES = 5;
const MIN_CRAWL_CANDIDATE_SCORE = 10;

const GENERIC_ORG_TOKENS = new Set([
  "association",
  "charity",
  "foundation",
  "friends",
  "fund",
  "inc",
  "institute",
  "nonprofit",
  "organization",
  "society",
  "the",
]);

const HELPFUL_SUBDOMAIN_PARTS = ["donate", "events", "give"];
const SUSPICIOUS_PATH_PARTS = [
  "article",
  "blog",
  "calendar",
  "event",
  "forum",
  "jobs",
  "news",
  "photo",
  "post",
  "profile",
  "search",
  "topic",
];
const DISALLOWED_HOST_SUFFIXES = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
  "threads.net",
  "youtube.com",
  "youtu.be",
  "indeed.com",
  "yelp.com",
  "tripadvisor.com",
  "tripadvisor.in",
  "hotels.com",
  "airbnb.com",
  "rvshare.com",
];
const DISALLOWED_PATH_EXTENSIONS = [
  ".pdf",
  ".csv",
  ".tsv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
  ".xml",
  ".json",
  ".txt",
];

export interface RankedCrawlCandidate {
  url: string;
  score: number;
  reasons: string[];
  candidateKey: string;
  sourceRank: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function tokenizeText(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(
      (token) => token.length >= 3 && !GENERIC_ORG_TOKENS.has(token),
    );
}

function createAcronym(orgName: string): string {
  return orgName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(
      (token) => token.length >= 3 && !GENERIC_ORG_TOKENS.has(token),
    )
    .map((token) => token[0])
    .join("");
}

function parseCandidateUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function getHostnameParts(hostname: string): string[] {
  return hostname
    .toLowerCase()
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSubdomainParts(hostname: string): string[] {
  const parts = getHostnameParts(hostname);
  if (parts.length <= 2) {
    return [];
  }

  return parts[0] === "www" ? parts.slice(1, -2) : parts.slice(0, -2);
}

function getPathParts(pathname: string): string[] {
  return pathname
    .toLowerCase()
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function hasDisallowedHostSuffix(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return DISALLOWED_HOST_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`),
  );
}

function hasDisallowedPathExtension(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return DISALLOWED_PATH_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

export function isEligibleCrawlCandidateUrl(url: string): boolean {
  const parsedUrl = parseCandidateUrl(url);
  if (!parsedUrl) {
    return false;
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return false;
  }

  if (hasDisallowedHostSuffix(parsedUrl.hostname)) {
    return false;
  }

  if (hasDisallowedPathExtension(parsedUrl.pathname)) {
    return false;
  }

  return true;
}

function scoreCandidate(
  result: StoredSearchResultItem,
  orgName: string,
): RankedCrawlCandidate {
  const parsedUrl = parseCandidateUrl(result.link);
  const hostname = parsedUrl?.hostname.toLowerCase() ?? "";
  const candidateKey = getCrawlCandidateKey(result.link);
  const hostnameCompact = normalizeText(candidateKey);
  const orgNameCompact = normalizeText(orgName);
  const orgTokens = tokenizeText(orgName);
  const acronym = createAcronym(orgName);
  const subdomainParts = parsedUrl ? getSubdomainParts(parsedUrl.hostname) : [];
  const pathParts = parsedUrl ? getPathParts(parsedUrl.pathname) : [];

  let score = 0;
  const reasons: string[] = [];
  let matchedHostnameTokens = 0;

  if (!parsedUrl) {
    return {
      url: result.link,
      score: Number.NEGATIVE_INFINITY,
      reasons: ["invalid_url"],
      candidateKey,
      sourceRank: result.rank,
    };
  }

  if (!isEligibleCrawlCandidateUrl(result.link)) {
    return {
      url: result.link,
      score: Number.NEGATIVE_INFINITY,
      reasons: ["disallowed_candidate_url"],
      candidateKey,
      sourceRank: result.rank,
    };
  }

  if (orgNameCompact && hostnameCompact.includes(orgNameCompact)) {
    score += 100;
    reasons.push("exact_org_name_in_hostname:+100");
  }

  if (acronym.length >= 3 && hostnameCompact.includes(acronym)) {
    score += 40;
    reasons.push("acronym_in_hostname:+40");
  }

  for (const token of orgTokens) {
    if (hostnameCompact.includes(token)) {
      score += 15;
      matchedHostnameTokens++;
      reasons.push(`hostname_token:${token}:+15`);
    }
  }

  if (candidateKey.endsWith(".org")) {
    score += 15;
    reasons.push("org_tld:+15");
  }

  if (subdomainParts.length === 0 || hostname.startsWith("www.")) {
    score += 10;
    reasons.push("root_or_www:+10");
  }

  for (const part of subdomainParts) {
    if (HELPFUL_SUBDOMAIN_PARTS.includes(part)) {
      score += 5;
      reasons.push(`helpful_subdomain:${part}:+5`);
    }
  }

  if (pathParts.length > 1) {
    const depthPenalty = (pathParts.length - 1) * 5;
    score -= depthPenalty;
    reasons.push(`path_depth:-${depthPenalty}`);
  }

  for (const part of pathParts) {
    if (SUSPICIOUS_PATH_PARTS.includes(part)) {
      score -= 20;
      reasons.push(`suspicious_path:${part}:-20`);
    }
  }

  if (
    matchedHostnameTokens === 0 &&
    (!orgNameCompact || !hostnameCompact.includes(orgNameCompact)) &&
    !(acronym.length >= 3 && hostnameCompact.includes(acronym))
  ) {
    score -= 25;
    reasons.push("hostname_keyword_mismatch:-25");
  }

  return {
    url: result.link,
    score,
    reasons,
    candidateKey,
    sourceRank: result.rank,
  };
}

export function getCrawlCandidateKey(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return url.trim().toLowerCase();
  }
}

export function rankCrawlCandidates(
  input: string | unknown,
  orgName: string,
  limit = MAX_CRAWL_CANDIDATES,
): RankedCrawlCandidate[] {
  let parsedInput = input;

  if (typeof input === "string") {
    try {
      parsedInput = JSON.parse(input);
    } catch {
      return [];
    }
  }

  const normalizedResults = normalizeStoredSearchResults(parsedInput);
  const bestCandidateByKey = new Map<string, RankedCrawlCandidate>();

  for (const result of normalizedResults.results) {
    const candidate = scoreCandidate(result, orgName);
    if (candidate.score < MIN_CRAWL_CANDIDATE_SCORE) {
      continue;
    }

    const existing = bestCandidateByKey.get(candidate.candidateKey);

    if (
      !existing ||
      candidate.score > existing.score ||
      (candidate.score === existing.score &&
        candidate.sourceRank < existing.sourceRank)
    ) {
      bestCandidateByKey.set(candidate.candidateKey, candidate);
    }
  }

  return [...bestCandidateByKey.values()]
    .sort((a, b) => b.score - a.score || a.sourceRank - b.sourceRank)
    .slice(0, limit);
}

export function extractCrawlCandidateUrls(
  input: string | unknown,
  orgName: string,
  limit = MAX_CRAWL_CANDIDATES,
): string[] {
  return rankCrawlCandidates(input, orgName, limit).map(
    (candidate) => candidate.url,
  );
}
