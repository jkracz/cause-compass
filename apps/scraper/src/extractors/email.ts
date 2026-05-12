import type { CheerioAPI } from "cheerio";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Exclude common false positives
const EXCLUDED_DOMAINS = new Set([
  "sentry.io",
  "wixpress.com",
  "example.com",
  "placeholder.com",
  "yoursite.com",
]);

/**
 * Extract email addresses from mailto: links and visible text.
 */
export function extractEmails($: CheerioAPI): string[] {
  const emails = new Set<string>();

  // mailto: links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const email = href
      .replace(/^mailto:/i, "")
      .split("?")[0]
      ?.trim();
    if (email) emails.add(email.toLowerCase());
  });

  // Text content scan
  const bodyText = $("body").text();
  const matches = bodyText.match(EMAIL_REGEX);
  if (matches) {
    for (const m of matches) {
      emails.add(m.toLowerCase());
    }
  }

  // Filter out false positives
  return [...emails]
    .filter((e) => {
      const domain = e.split("@")[1];
      return domain && !EXCLUDED_DOMAINS.has(domain);
    })
    .slice(0, 10);
}
