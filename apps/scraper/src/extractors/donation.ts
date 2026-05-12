import type { CheerioAPI } from "cheerio";

const DONATION_KEYWORDS = /\b(donat|give|support|contribut|fundrais|pledge)/i;

const DONATION_HREF_PATTERNS = [
  /donat/i,
  /give/i,
  /support/i,
  /contribut/i,
  /fundrais/i,
];

/**
 * Extract donation-related links from anchors.
 * Matches on both href path and link text.
 */
export function extractDonationLinks($: CheerioAPI, baseUrl: string): string[] {
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const text = $(el).text().trim();
    const matchesHref = DONATION_HREF_PATTERNS.some((p) => p.test(href));
    const matchesText = DONATION_KEYWORDS.test(text);

    if (matchesHref || matchesText) {
      try {
        const url = new URL(href, baseUrl);
        // Only keep http(s) links
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
