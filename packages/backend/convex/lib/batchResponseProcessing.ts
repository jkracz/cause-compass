/**
 * Batch Response Processing Utilities for Convex
 *
 * Contains helper functions for processing OpenAI batch responses,
 * extracting social media URLs, logos, and donation links from crawl data.
 *
 * Ported from: apps/parsley/src/utils/parseUtils.ts
 * and apps/parsley/src/services/batchResponseProcessor.ts
 */

/**
 * Social media URLs object
 */
export interface SocialMediaUrls {
  linkedin?: string;
  youtube?: string;
  x?: string;
  instagram?: string;
  threads?: string;
  facebook?: string;
  twitter?: string;
}

/**
 * Crawl result data structure
 */
export interface CrawlItemData {
  sourceUrl: string;
  textContent?: string;
  aboutLinks?: string[];
  donationLinks?: string[];
  socialMediaUrls?: string[];
  logoLinks?: string[];
  emailAddresses?: string[];
}

/**
 * Normalizes a URL by removing protocol and trailing slashes for comparison.
 * @param url - The URL to normalize
 * @returns The normalized URL string
 */
export function normalizeUrlForComparison(url: string): string {
  return url
    .replace(/https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

/**
 * Filters crawl items to find those matching the confirmed website URL.
 * Matches are based on URL containment after normalization.
 *
 * @param crawlItems - Array of crawl results
 * @param correctWebsiteUrl - The confirmed correct website URL
 * @returns Array of matching crawl items
 */
export function filterCorrectCrawlItems(
  crawlItems: CrawlItemData[],
  correctWebsiteUrl: string
): CrawlItemData[] {
  if (!correctWebsiteUrl || !crawlItems?.length) {
    return [];
  }

  const normalizedCorrectUrl = normalizeUrlForComparison(correctWebsiteUrl);

  return crawlItems.filter((ci) => {
    const normalizedCrawlUrl = normalizeUrlForComparison(ci.sourceUrl);
    return (
      normalizedCrawlUrl.includes(normalizedCorrectUrl) ||
      normalizedCorrectUrl.includes(normalizedCrawlUrl)
    );
  });
}

/**
 * Extracts social media URLs from a given array of URLs.
 *
 * @param socials - An array of URLs to extract social media URLs from.
 * @returns An object containing the extracted social media URLs, keyed by platform.
 */
export function extractSocialMediaUrls(socials: string[]): SocialMediaUrls {
  if (!socials || !Array.isArray(socials) || socials.length === 0) {
    return {};
  }

  // Skip URLs that are clearly sharing/intent URLs or are not strings
  const filteredSocials = socials.filter(
    (url) =>
      url &&
      typeof url === "string" &&
      !url.includes("sharer") &&
      !url.includes("intent/tweet") &&
      !url.includes("shareArticle") &&
      !url.includes("share?") &&
      !url.includes("share.php")
  );

  if (filteredSocials.length === 0) {
    return {};
  }

  // Platform-specific regex patterns for profile URLs
  const socialUrlPatterns = {
    facebook:
      /^https?:\/\/(www\.)?facebook\.com\/(?!sharer|hashtag|photo\.php|share|post|story|watch|gaming|events|marketplace|groups|pages|messages|bookmarks|notifications|me\/|home\.php|campaign\/|l\.php)([^/?&]+)\/?(?!\/)(?!posts|photos|videos|about)/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/([^/?&]+)\/?$/i,
    linkedin:
      /^https?:\/\/(www\.)?linkedin\.com\/(company|school|in)\/([^/?&]+)\/?$/i,
    x: /^https?:\/\/(www\.)?x\.com\/([^/?&]+)\/?$/i,
    twitter: /^https?:\/\/(www\.)?twitter\.com\/([^/?&]+)\/?$/i,
    youtube:
      /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/)?([^/?&]+)\/?$/i,
    threads: /^https?:\/\/(www\.)?threads\.net\/@?([^/?&]+)\/?$/i,
  };

  const socialMediaUrls: SocialMediaUrls = {};

  // Process each URL
  for (const social of filteredSocials) {
    // Extract platform-specific profile URLs
    if (socialUrlPatterns.facebook.test(social) && !socialMediaUrls.facebook) {
      const match = social.match(socialUrlPatterns.facebook);
      if (match && match[2]) {
        const username = match[2];
        socialMediaUrls.facebook = `https://www.facebook.com/${username}`;
      }
    } else if (
      socialUrlPatterns.instagram.test(social) &&
      !socialMediaUrls.instagram
    ) {
      const match = social.match(socialUrlPatterns.instagram);
      if (match && match[2]) {
        const username = match[2];
        socialMediaUrls.instagram = `https://www.instagram.com/${username}`;
      }
    } else if (
      socialUrlPatterns.linkedin.test(social) &&
      !socialMediaUrls.linkedin
    ) {
      const match = social.match(socialUrlPatterns.linkedin);
      if (match) {
        socialMediaUrls.linkedin = social.split("?")[0]; // Remove query parameters
      }
    } else if (
      (socialUrlPatterns.twitter.test(social) ||
        socialUrlPatterns.x.test(social)) &&
      !socialMediaUrls.x
    ) {
      // Handle both twitter.com and x.com URLs, but store as x
      const match =
        social.match(socialUrlPatterns.twitter) ||
        social.match(socialUrlPatterns.x);
      if (match && match[2]) {
        const username = match[2];
        socialMediaUrls.x = `https://twitter.com/${username}`; // Still using twitter.com as the canonical URL
      }
    } else if (
      socialUrlPatterns.youtube.test(social) &&
      !socialMediaUrls.youtube
    ) {
      // YouTube channel links can have different formats
      if (social.includes("/channel/")) {
        socialMediaUrls.youtube = social.split("?")[0]; // Preserve channel ID format
      } else {
        const match = social.match(socialUrlPatterns.youtube);
        if (match && match[3]) {
          const channelOrUser = match[3];
          socialMediaUrls.youtube = `https://www.youtube.com/${
            social.includes("/user/") ? "user" : "c"
          }/${channelOrUser}`;
        }
      }
    } else if (
      socialUrlPatterns.threads.test(social) &&
      !socialMediaUrls.threads
    ) {
      const match = social.match(socialUrlPatterns.threads);
      if (match && match[2]) {
        const username = match[2];
        socialMediaUrls.threads = `https://www.threads.net/@${username.replace(/^@/, "")}`;
      }
    }
  }

  // Fall back to the old method for any platforms we didn't find
  const oldSocialUrls: Record<keyof SocialMediaUrls, RegExp> = {
    linkedin: /https?:\/\/(www\.)?linkedin\.com\/company\/?/,
    youtube: /https?:\/\/(www\.)?youtube\.com\/channel\/?/,
    x: /https?:\/\/(www\.)?x\.com\/?/,
    twitter: /https?:\/\/(www\.)?twitter\.com\/?/,
    instagram: /https?:\/\/(www\.)?instagram\.com\/?/,
    threads: /https?:\/\/(www\.)?threads\.net\/?/,
    facebook: /https?:\/\/(www\.)?facebook\.com\/?/,
  };

  for (const social of filteredSocials) {
    for (const platform in oldSocialUrls) {
      if (
        Object.prototype.hasOwnProperty.call(oldSocialUrls, platform) &&
        !socialMediaUrls[platform as keyof SocialMediaUrls]
      ) {
        const regex = oldSocialUrls[platform as keyof SocialMediaUrls];
        if (regex.test(social)) {
          // Don't include sharing/post links even in the fallback
          if (!social.includes("sharer") && !social.includes("share")) {
            socialMediaUrls[platform as keyof SocialMediaUrls] = social;
          }
        }
      }
    }
  }

  return socialMediaUrls;
}

/**
 * Finds the best logo URL from an array of potential logo URLs.
 * Scores each URL based on filename patterns, file format, and path structure.
 *
 * @param logoUrls - Array of potential logo URLs
 * @returns The best logo URL or undefined if none found
 */
export function findMainLogo(logoUrls: string[]): string | undefined {
  if (!logoUrls?.length) return undefined;

  // Score each potential logo URL
  const scoredLogos = logoUrls.map((url) => {
    // Ensure url is a string
    if (!url || typeof url !== "string") {
      return { url: "", score: -1000 }; // Return with very low score
    }

    const filename = url.split("/").pop()?.toLowerCase() || "";
    const path = url.toLowerCase();

    let score = 0;

    // Check if "logo" is in the filename
    if (filename.includes("logo")) score += 30;

    // Look for logo.png, logo.svg, etc.
    if (/^logo[._-]?/.test(filename)) score += 20;

    // Prioritize certain file formats
    if (filename.endsWith(".svg")) score += 15;
    if (filename.endsWith(".png")) score += 10;
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) score += 5;

    // Avoid third-party logos
    if (
      path.includes("guidestar") ||
      path.includes("charity-navigator") ||
      path.includes("partner")
    )
      score -= 50;

    // Prefer logos in main image directories
    if (path.includes("/images/logo") || path.includes("/img/logo"))
      score += 15;

    // Prefer logos in higher-level directories
    const depth = (url.match(/\//g) || []).length;
    score -= depth * 2;

    // Avoid thumbnails and small versions
    if (
      filename.includes("thumb") ||
      filename.includes("small") ||
      filename.includes("icon")
    )
      score -= 15;

    return { url, score };
  });

  // Sort by score (highest first) and return the best match
  scoredLogos.sort((a, b) => b.score - a.score);
  const bestLogo = scoredLogos[0];
  return bestLogo && bestLogo.score > -999 ? bestLogo.url : undefined;
}

/**
 * Finds the best donation link from an array of URLs.
 * Scores links based on donation-related keywords and known donation services.
 *
 * @param links - Array of potential donation URLs
 * @returns The best donation link or undefined if none found
 */
export function findBestDonationLink(links: string[]): string | undefined {
  if (!links?.length) return undefined;

  const donationKeywords = [
    "donate",
    "donation",
    "giving",
    "support",
    "contribute",
    "sponsor",
    "gift",
    "givingtuesday",
    "give",
    "donor",
  ];

  // Regex for common donation processors
  const donationServices = [
    /paypal\.com\/donate/i,
    /donorbox\.org/i,
    /networkforgood\.com/i,
    /secure\.givelively\.org/i,
  ];

  // Score each link
  const scoredLinks = links.map((link) => {
    // Ensure link is a string
    if (!link || typeof link !== "string") {
      return { link: "", score: -1000 }; // Return with very low score
    }

    const lowerLink = link.toLowerCase();

    let score = 0;

    // Highest priority: Donation services
    if (donationServices.some((regex) => regex.test(link))) {
      score += 100;
    }

    // Check for exact donation keywords in URL
    donationKeywords.forEach((keyword) => {
      if (lowerLink.includes(`/${keyword}`)) score += 30;
      if (lowerLink.includes(`${keyword}.`)) score += 25;
      if (lowerLink.includes(`-${keyword}`)) score += 20;
      if (lowerLink.includes(`_${keyword}`)) score += 20;
      if (lowerLink.includes(`=${keyword}`)) score += 15;
    });

    return { link, score };
  });

  // Sort by score (highest first)
  scoredLinks.sort((a, b) => b.score - a.score);

  // Return best match if it has a score > 0, otherwise return first valid link
  const bestLink = scoredLinks[0];
  if (bestLink && bestLink.score > 0) {
    return bestLink.link;
  } else {
    // Find the first valid string link
    const firstValidLink = links.find((link) => typeof link === "string");
    return firstValidLink;
  }
}

/**
 * Collects all social media URLs from an array of crawl items.
 *
 * @param crawlItems - Array of crawl results
 * @returns Flattened array of all social media URLs
 */
export function collectSocialMediaUrls(crawlItems: CrawlItemData[]): string[] {
  return crawlItems.reduce<string[]>((acc, ci) => {
    return [...acc, ...(ci.socialMediaUrls ?? [])];
  }, []);
}

/**
 * Collects all logo URLs from an array of crawl items.
 *
 * @param crawlItems - Array of crawl results
 * @returns Flattened array of all logo URLs
 */
export function collectLogoUrls(crawlItems: CrawlItemData[]): string[] {
  return crawlItems.reduce<string[]>((acc, ci) => {
    return [...acc, ...(ci.logoLinks ?? [])];
  }, []);
}

/**
 * Collects all donation links from an array of crawl items.
 *
 * @param crawlItems - Array of crawl results
 * @returns Flattened array of all donation URLs
 */
export function collectDonationLinks(crawlItems: CrawlItemData[]): string[] {
  return crawlItems.reduce<string[]>((acc, ci) => {
    return [...acc, ...(ci.donationLinks ?? [])];
  }, []);
}

/**
 * Collects all email addresses from an array of crawl items.
 *
 * @param crawlItems - Array of crawl results
 * @returns Flattened array of all email addresses (deduplicated)
 */
export function collectEmailAddresses(crawlItems: CrawlItemData[]): string[] {
  const emails = crawlItems.reduce<string[]>((acc, ci) => {
    return [...acc, ...(ci.emailAddresses ?? [])];
  }, []);
  return [...new Set(emails)]; // Deduplicate
}

/**
 * Processes crawl data for an organization given the confirmed website URL.
 * Extracts social media URLs, logo, donation link, and emails from matching crawl items.
 *
 * @param crawlItems - Array of crawl results for the organization
 * @param correctWebsiteUrl - The confirmed correct website URL
 * @returns Extracted data from the correct crawl items
 */
export function processCrawlDataForConfirmedWebsite(
  crawlItems: CrawlItemData[],
  correctWebsiteUrl: string
): {
  socialMediaUrls: SocialMediaUrls;
  logoUrl: string | undefined;
  donationUrl: string | undefined;
  emailAddresses: string[];
} {
  // Filter to only crawl items matching the correct website
  const correctCrawlItems = filterCorrectCrawlItems(
    crawlItems,
    correctWebsiteUrl
  );

  // If no matching crawl items, use all available crawl data
  const itemsToProcess =
    correctCrawlItems.length > 0 ? correctCrawlItems : crawlItems;

  // Extract data from the matching crawl items
  const socialMediaUrls = extractSocialMediaUrls(
    collectSocialMediaUrls(itemsToProcess)
  );
  const logoUrl = findMainLogo(collectLogoUrls(itemsToProcess));
  const donationUrl = findBestDonationLink(
    collectDonationLinks(itemsToProcess)
  );
  const emailAddresses = collectEmailAddresses(itemsToProcess);

  return {
    socialMediaUrls,
    logoUrl,
    donationUrl,
    emailAddresses,
  };
}
