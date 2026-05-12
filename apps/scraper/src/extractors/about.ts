import type { CheerioAPI } from "cheerio";

const ABOUT_PATTERNS = [
  /\/about/i,
  /\/mission/i,
  /\/who-we-are/i,
  /\/our-story/i,
  /\/our-work/i,
  /\/what-we-do/i,
];

const ABOUT_TEXT_PATTERNS =
  /\b(about\s*us|our\s*mission|who\s*we\s*are|our\s*story|what\s*we\s*do|our\s*work)\b/i;

/**
 * Extract about/mission page links.
 */
export function extractAboutLinks($: CheerioAPI, baseUrl: string): string[] {
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const text = $(el).text().trim();
    const matchesHref = ABOUT_PATTERNS.some((p) => p.test(href));
    const matchesText = ABOUT_TEXT_PATTERNS.test(text);

    if (matchesHref || matchesText) {
      try {
        const url = new URL(href, baseUrl);
        if (url.protocol === "http:" || url.protocol === "https:") {
          links.add(url.href);
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return [...links].slice(0, 10);
}
