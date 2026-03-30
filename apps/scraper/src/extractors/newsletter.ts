import type { CheerioAPI } from "cheerio";

const NEWSLETTER_KEYWORDS =
  /\b(newsletter|subscribe|sign.?up|mailing.?list|email.?updates|stay.?informed|stay.?connected)\b/i;

/**
 * Detect if the page has a newsletter signup form.
 * Looks for forms with email inputs near newsletter-related text.
 */
export function detectNewsletterSignup($: CheerioAPI): boolean {
  // Check forms with email inputs
  const emailInputs = $(
    'form input[type="email"], form input[name*="email"], form input[placeholder*="email" i]',
  );

  if (emailInputs.length === 0) return false;

  // Check if any email input's parent form or nearby text mentions newsletter
  let found = false;

  emailInputs.each((_, el) => {
    if (found) return;
    const $form = $(el).closest("form");
    const formText = $form.length > 0 ? $form.text() : "";

    // Also check surrounding section/div
    const $section = $(el).closest("section, div, footer");
    const sectionText = $section.length > 0 ? $section.text() : "";

    if (
      NEWSLETTER_KEYWORDS.test(formText) ||
      NEWSLETTER_KEYWORDS.test(sectionText)
    ) {
      found = true;
    }
  });

  return found;
}
