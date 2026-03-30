import type { CheerioAPI } from "cheerio";

/**
 * Extract visible text content from a page.
 * Strips scripts, styles, noscript, and collapses whitespace.
 * Returns trimmed text, capped at 50K chars.
 */
export function extractText($: CheerioAPI): string {
  // Remove non-visible elements
  $("script, style, noscript, svg, iframe").remove();

  const raw = $("body").text();
  const collapsed = raw.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, 50_000);
}
