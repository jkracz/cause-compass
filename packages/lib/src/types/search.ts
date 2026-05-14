import * as z from "zod";

// Search Result Schema
export const SearchResultSchema = z.object({
  kind: z.string(),
  title: z.string(),
  htmlTitle: z.string(),
  link: z.string(),
  displayLink: z.string(),
  snippet: z.string(),
  htmlSnippet: z.string(),
  formattedUrl: z.string(),
  htmlFormattedUrl: z.string(),
  pagemap: z.record(z.string(), z.any()).optional(),
});

export const StoredSearchResultItemSchema = z.object({
  rank: z.number().int().positive(),
  link: z.string(),
  title: z.string().optional(),
  snippet: z.string().optional(),
  displayLink: z.string().optional(),
});

export const StoredSearchResultsSchema = z.array(StoredSearchResultItemSchema);

export type StoredSearchResultNormalizationIssue =
  | "invalid_shape"
  | "all_items_filtered";

export interface NormalizeStoredSearchResultsResult {
  results: StoredSearchResults;
  issue?: StoredSearchResultNormalizationIssue;
}

const EXCLUDED_SEARCH_HOSTS = new Set([
  "en.wikipedia.org",
  "guidestar.org",
  "www.guidestar.org",
  "greatnonprofits.org",
  "www.greatnonprofits.org",
  "irs.gov",
  "www.irs.gov",
  "sec.gov",
  "www.sec.gov",
  "zillow.com",
  "www.zillow.com",
  "volunteermatch.org",
  "www.volunteermatch.org",
]);

const UNWANTED_SUBDOMAIN_PARTS = [
  "blog",
  "shop",
  "store",
  "mail",
  "staging",
  "dev",
  "test",
];

function getSearchResultsArray(input: unknown): unknown[] | null {
  if (Array.isArray(input)) {
    return input;
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "results" in input &&
    Array.isArray(input.results)
  ) {
    return input.results;
  }

  return null;
}

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSearchHostname(value: string): string | null {
  try {
    const normalizedValue =
      value.startsWith("http://") || value.startsWith("https://")
        ? value
        : `https://${value}`;
    return new URL(normalizedValue).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function hasUnwantedSubdomain(hostname: string): boolean {
  const hostnameWithoutWww = hostname.startsWith("www.")
    ? hostname.slice(4)
    : hostname;
  const parts = hostnameWithoutWww.split(".");

  if (parts.length <= 2) {
    return false;
  }

  const subdomain = parts.slice(0, -2).join(".");
  if (!subdomain) {
    return false;
  }

  return UNWANTED_SUBDOMAIN_PARTS.some((part) => subdomain.includes(part));
}

function shouldExcludeStoredSearchResult(
  candidate: Record<string, unknown>,
): boolean {
  const link = getOptionalString(candidate.link);
  const displayLink = getOptionalString(candidate.displayLink);
  const hostname = parseSearchHostname(link ?? displayLink ?? "");

  if (!hostname) {
    return false;
  }

  if (EXCLUDED_SEARCH_HOSTS.has(hostname)) {
    return true;
  }

  return hasUnwantedSubdomain(hostname);
}

export function normalizeStoredSearchResults(
  input: unknown,
): NormalizeStoredSearchResultsResult {
  const rawResults = getSearchResultsArray(input);
  if (!rawResults) {
    return { results: [], issue: "invalid_shape" };
  }

  const normalizedResults = rawResults.reduce<StoredSearchResults>(
    (acc, item) => {
      if (typeof item !== "object" || item === null) {
        return acc;
      }

      const candidate = item as Record<string, unknown>;
      const link = getOptionalString(candidate.link);
      if (!link) {
        return acc;
      }

      if (shouldExcludeStoredSearchResult(candidate)) {
        return acc;
      }

      acc.push({
        rank: acc.length + 1,
        link,
        title: getOptionalString(candidate.title),
        snippet: getOptionalString(candidate.snippet),
        displayLink: getOptionalString(candidate.displayLink),
      });

      return acc;
    },
    [],
  );

  const parsedResults = StoredSearchResultsSchema.safeParse(normalizedResults);
  if (!parsedResults.success) {
    return { results: [], issue: "invalid_shape" };
  }

  if (rawResults.length > 0 && parsedResults.data.length === 0) {
    return { results: parsedResults.data, issue: "all_items_filtered" };
  }

  return { results: parsedResults.data };
}

// Social Media URLs Schema
export const SocialMediaUrlsSchema = z.object({
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  x: z.string().optional(),
  instagram: z.string().optional(),
  threads: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
});

// Crawl Item Schema
export const CrawlItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  textContent: z.string(),
  socialMediaUrls: z.array(z.string()).optional(),
  hasNewsletterSignup: z.boolean().optional(),
  donationLinks: z.array(z.string()).optional(),
  emailAddresses: z.array(z.string()).optional(),
  logoLinks: z.array(z.string()).optional(),
  aboutLinks: z.array(z.string()).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
export type StoredSearchResultItem = z.infer<
  typeof StoredSearchResultItemSchema
>;
export type StoredSearchResults = z.infer<typeof StoredSearchResultsSchema>;
export type SocialMediaUrls = z.infer<typeof SocialMediaUrlsSchema>;
export type CrawlItem = z.infer<typeof CrawlItemSchema>;
