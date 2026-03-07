import { load } from "cheerio";
import type { CrawlResult } from "../convex-client.js";
import { extractText } from "./text.js";
import { extractSocialMediaUrls } from "./social.js";
import { extractDonationLinks } from "./donation.js";
import { extractLogoLinks } from "./logo.js";
import { extractEmails } from "./email.js";
import { detectNewsletterSignup } from "./newsletter.js";
import { extractAboutLinks } from "./about.js";

/**
 * Run all extractors on raw HTML and return a CrawlResult.
 */
export function extractAll(html: string, sourceUrl: string): CrawlResult {
  const $ = load(html);

  return {
    textContent: extractText($),
    socialMediaUrls: extractSocialMediaUrls($),
    donationLinks: extractDonationLinks($, sourceUrl),
    logoLinks: extractLogoLinks($, sourceUrl),
    emailAddresses: extractEmails($),
    hasNewsletterSignup: detectNewsletterSignup($),
    aboutLinks: extractAboutLinks($, sourceUrl),
  };
}

export { extractText } from "./text.js";
