import type { CheerioAPI } from "cheerio";

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /facebook\.com\/[^/\s"']+/i,
  twitter: /(?:twitter|x)\.com\/[^/\s"']+/i,
  instagram: /instagram\.com\/[^/\s"']+/i,
  linkedin: /linkedin\.com\/(?:company|in)\/[^/\s"']+/i,
  youtube: /youtube\.com\/(?:@|channel\/|c\/|user\/)[^/\s"']+/i,
  threads: /threads\.net\/@?[^/\s"']+/i,
};

/**
 * Extract social media URLs from anchor hrefs.
 * Returns unique URLs, one per platform.
 */
export function extractSocialMediaUrls($: CheerioAPI): string[] {
  const found = new Map<string, string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!found.has(platform) && pattern.test(href)) {
        try {
          const url = new URL(href, "https://placeholder.com");
          found.set(platform, url.href);
        } catch {
          // Invalid URL, skip
        }
      }
    }
  });

  return [...found.values()];
}
