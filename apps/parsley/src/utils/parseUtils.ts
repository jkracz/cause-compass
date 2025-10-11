import { TaxExemptOrganization, SocialMediaUrls } from "@cause/types";
import { parse } from "tldts";

const MAX_URLS_TO_CRAWL = 5;

/**
 * Creates an acronym from a string by taking the first letter of each word.
 * @param str - The input string to create an acronym from
 * @returns The acronym as a string of uppercase letters
 * @example createAcronym("American Red Cross") => "ARC"
 */
export const createAcronym = (str: string) => {
  return str
    .split(/\s+/)
    .map((word) => word[0].toUpperCase())
    .join("");
};

/**
 * Normalizes a URL or string by extracting and cleaning the domain name.
 * @param url - The URL or string to normalize
 * @returns The normalized domain name in lowercase, or cleaned string if no domain found
 * @example normalize("https://www.redcross.org/donate") => "redcross.org"
 */
export const normalize = (url: string): string => {
  const parsed = parse(url);
  return parsed.domain
    ? parsed.domain.toLowerCase()
    : url.toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * Checks if a URL contains an unwanted subdomain that should be filtered out.
 * Allows useful subdomains like "donate" or "events" while filtering out
 * non-primary subdomains like "blog", "shop", "staging", etc.
 *
 * @param url - The URL to check
 * @returns True if the subdomain should be filtered out, false if it should be kept
 * @example
 * hasUnwantedSubdomain("https://donate.redcross.org") => false (keep)
 * hasUnwantedSubdomain("https://blog.redcross.org") => true (filter out)
 */
const hasUnwantedSubdomain = (url: string): boolean => {
  const parsed = parse(url);
  const subdomain = parsed.subdomain;

  // Allow www and no subdomain
  if (subdomain === "www" || subdomain === "") {
    return false;
  }

  // Filter out common unwanted subdomains
  const unwantedSubdomains = [
    "blog",
    "shop",
    "store",
    "mail",
    "ftp",
    "staging",
    "dev",
    "test",
  ];
  return unwantedSubdomains.some((unwanted) => subdomain?.includes(unwanted));
};

/**
 * Scores a URL based on how likely it is to be the official website for an organization.
 * Uses organization name matching, keyword analysis, and domain patterns to calculate relevance.
 *
 * @param url - The URL to score
 * @param orgName - The organization's name
 * @param acronym - The organization's acronym
 * @returns A numeric score (higher = more likely to be the official site)
 *
 * Scoring criteria:
 * - Exact org name match: +100 points
 * - Acronym match: +50 points
 * - Individual keyword matches: +20 points each
 * - Keyword at start of domain: +10 points additional
 * - .org domain: +20 points
 *
 * @example scoreUrl("redcross.org", "American Red Cross", "ARC") => 140+ points
 */
const scoreUrl = (url: string, orgName: string, acronym: string): number => {
  const normalizedUrl = normalize(url);
  const normalizedOrgName = normalize(orgName);
  const normalizedAcronym = normalize(acronym);
  const keywords = orgName.split(/\s+/).map(normalize);

  let score = 0;

  // Exact matches for org name and acronym
  if (normalizedUrl.includes(normalizedOrgName)) score += 100;
  if (normalizedUrl.includes(normalizedAcronym)) score += 50;

  // Partial matches for keywords
  for (const keyword of keywords) {
    if (normalizedUrl.includes(keyword)) score += 20;
    if (normalizedUrl.startsWith(keyword)) score += 10;
  }

  // Domain scoring
  if (normalizedUrl.includes("org")) score += 20;

  return score;
};

/**
 * Finds and ranks the best URLs for an organization from its search results.
 * Filters out social media, unwanted subdomains, and duplicates, then scores and sorts
 * by relevance to return the top 20 most promising URLs for web crawling.
 *
 * @param org - The tax-exempt organization with search results
 * @param acronym - The organization's acronym for scoring
 * @returns Array of up to 20 best URLs, sorted by relevance score (highest first)
 *
 * Process:
 * 1. Filters out social media platforms (LinkedIn, Facebook, etc.)
 * 2. Removes unwanted subdomains (blog, shop, staging, etc.)
 * 3. Deduplicates by normalized domain
 * 4. Scores URLs based on organization name matching
 * 5. Returns top 20 URLs sorted by score
 *
 * @example findBestUrls(redCrossOrg, "ARC") => ["https://redcross.org", "https://redcross.org/donate", ...]
 */
export const findBestUrls = (
  org: TaxExemptOrganization,
  acronym: string,
): string[] => {
  const excludePatterns = [
    /(www\.)?linkedin\.com\/?/,
    /(www\.)?youtube\.com/,
    /(www\.)?x\.com\/?/,
    /(www\.)?twitter\.com\/?/,
    /(www\.)?instagram\.com\/?/,
    /(www\.)?threads\.net\/?/,
    /(www\.)?facebook\.com\/?/,
    /(www\.)?en.wikipedia\.org/,
    /(www\.)?guidestar\.org\/?/,
    /(www\.)?greatnonprofits\.org\/?/,
    /(www\.)?irs\.gov/,
    /(www\.)?sec\.gov/,
    /(www\.)?zillow\.com/,
    /(www\.)?volunteermatch\.org/,
  ];

  if (org.searchResults) {
    const seenUrls = new Set<string>();
    const filteredResults = org.searchResults.filter((result) => {
      const normalizedUrl = normalize(result.displayLink);
      const isSocialMedia = excludePatterns.some((pattern) =>
        pattern.test(result.displayLink),
      );
      const isDuplicate = seenUrls.has(normalizedUrl);
      const hasUnwanted = hasUnwantedSubdomain(result.displayLink);

      if (!isSocialMedia && !isDuplicate && !hasUnwanted) {
        seenUrls.add(normalizedUrl);
        return true;
      }
      return false;
    });

    const scoredResults = filteredResults.map((result) => {
      return {
        link: result.displayLink,
        fullLink: result.link,
        score: scoreUrl(result.displayLink, org.name, acronym),
      };
    });

    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, MAX_URLS_TO_CRAWL).map((result) => {
      return result.fullLink.startsWith("https://") ||
        result.fullLink.startsWith("http://")
        ? `https://${result.link}`
        : `http://${result.link}`;
    });
  }
  return [];
};

/**
 * Extracts social media URLs from a given array of URLs.
 *
 * @param socials - An array of URLs to extract social media URLs from.
 * @returns An object containing the extracted social media URLs, keyed by platform.
 */
export const extractSocialMediaUrls = (socials: string[]): SocialMediaUrls => {
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
      !url.includes("share.php"),
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
  const oldSocialUrls = {
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
        !socialMediaUrls[platform as keyof typeof socialMediaUrls]
      ) {
        const regex = oldSocialUrls[platform as keyof typeof oldSocialUrls];
        if (regex.test(social)) {
          // Don't include sharing/post links even in the fallback
          if (!social.includes("sharer") && !social.includes("share")) {
            socialMediaUrls[platform as keyof typeof socialMediaUrls] = social;
          }
        }
      }
    }
  }

  return socialMediaUrls;
};

export const findMainLogo = (logoUrls: string[]): string | undefined => {
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
  return scoredLogos[0]?.score > -999 ? scoredLogos[0]?.url : undefined;
};

export const findBestDonationLink = (links: string[]): string | undefined => {
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
  if (scoredLinks[0]?.score > 0) {
    return scoredLinks[0].link;
  } else {
    // Find the first valid string link
    const firstValidLink = links.find((link) => typeof link === "string");
    return firstValidLink;
  }
};
