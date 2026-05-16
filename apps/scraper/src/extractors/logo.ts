import type { CheerioAPI } from "cheerio";

/**
 * Extract logo image URLs.
 * Looks at og:image, img tags with logo-related class/alt/id, and link[rel=icon].
 */
export function extractLogoLinks($: CheerioAPI, baseUrl: string): string[] {
  const logos = new Set<string>();

  function isSvgLogoCandidate(src: string): boolean {
    const normalized = src.trim().toLowerCase();
    if (normalized.startsWith("data:image/svg+xml")) return true;

    try {
      const url = new URL(src, baseUrl);
      return url.pathname.toLowerCase().endsWith(".svg");
    } catch {
      return normalized.endsWith(".svg");
    }
  }

  function addUrl(src: string | undefined) {
    if (!src) return;
    if (isSvgLogoCandidate(src)) return;

    try {
      const url = new URL(src, baseUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        logos.add(url.href);
      }
    } catch {
      // Invalid URL
    }
  }

  // og:image (often the logo or main brand image)
  const ogImage = $('meta[property="og:image"]').attr("content");
  addUrl(ogImage);

  // Images with "logo" in class, alt, id, or src
  $("img").each((_, el) => {
    const $el = $(el);
    const attrs = [
      $el.attr("class") ?? "",
      $el.attr("alt") ?? "",
      $el.attr("id") ?? "",
      $el.attr("src") ?? "",
    ].join(" ");

    if (/logo/i.test(attrs)) {
      addUrl($el.attr("src"));
    }
  });

  // Favicon / apple-touch-icon
  $('link[rel="icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    addUrl($(el).attr("href"));
  });

  return [...logos].slice(0, 5);
}
