import {
  MAX_BATCH_CRAWL_PAGES,
  MAX_BATCH_PAGE_TEXT_CHARS,
} from "../convex/batch/constants";
import { sanitizeUnicodeString } from "./unicodeSanitization";

export interface BatchPromptCrawlItem {
  sourceUrl: string;
  textContent?: string;
}

export interface SelectedBatchPromptCrawlItem {
  url: string;
  title: string;
  textContent: string;
}

const INCOMPLETE_ESCAPE_SUFFIX = /\\(?:x[0-9A-Fa-f]?|u[0-9A-Fa-f]{0,3})?$/;
const PAGE_CHUNK_WORDS = 40;
const LOW_VALUE_PATH_PATTERN =
  /\/(?:privacy|terms|policy|accessibility|sitemap|cookie)(?:\/|$)/i;
const HIGH_VALUE_PATH_PATTERN =
  /\/(?:about|about-us|who-we-are|mission|our-mission|our-story|history|overview|leadership|team|staff|board|programs?|services?|what-we-do|initiatives?)(?:\/|$)/i;
const NEWS_PATH_PATTERN =
  /\/(?:news|blog|article|articles|press|events?|calendar|stories?)(?:\/|$)/i;
const BOILERPLATE_PHRASES = [
  "skip to content",
  "skip to main content",
  "skip to footer",
  "skip to navigation",
  "main navigation",
  "open menu",
  "close menu",
  "toggle navigation",
  "privacy policy",
  "cookie policy",
  "cookie preferences",
  "all rights reserved",
  "follow us",
  "read more",
  "learn more",
  "view all",
  "search for:",
  "search",
  "menu",
  "accessibility",
  "sitemap",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "twitter",
  "threads",
  "tiktok",
];
const INFORMATIVE_PHRASES = [
  "mission",
  "history",
  "founded",
  "nonprofit",
  "foundation",
  "organization",
  "institute",
  "museum",
  "center",
  "centre",
  "community",
  "program",
  "service",
  "support",
  "dedicated",
  "committed",
  "provides",
  "providing",
  "serves",
  "serving",
  "our work",
  "our mission",
  "we are",
  "works to",
  "about us",
];

function normalizeCrawlUrlForBatch(url: string): string {
  const sanitizedUrl = sanitizeUnicodeString(url);

  try {
    const parsed = new URL(sanitizedUrl);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.hostname.toLowerCase()}${normalizedPath.toLowerCase()}`;
  } catch {
    return sanitizedUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }
}

function truncateBatchText(textContent: string | undefined): string {
  const normalizedText = cleanBatchText(textContent ?? "");
  if (normalizedText.length <= MAX_BATCH_PAGE_TEXT_CHARS) {
    return normalizedText;
  }

  const truncatedText = cleanBatchText(
    normalizedText.slice(0, MAX_BATCH_PAGE_TEXT_CHARS),
  );
  return `${truncatedText}\n...[truncated]`;
}

function sanitizeBatchText(textContent: string): string {
  const sanitizedText = sanitizeUnicodeString(textContent).trim();
  return sanitizedText.replace(INCOMPLETE_ESCAPE_SUFFIX, "");
}

function cleanBatchText(textContent: string): string {
  const sanitizedText = sanitizeBatchText(textContent);
  const strippedText = stripBoilerplateText(sanitizedText);

  if (
    strippedText.length === 0 ||
    strippedText.length < Math.min(500, sanitizedText.length / 4)
  ) {
    return sanitizedText;
  }

  return strippedText;
}

function stripBoilerplateText(textContent: string): string {
  let normalizedText = textContent.replace(/\s+/g, " ").trim();

  for (const phrase of BOILERPLATE_PHRASES) {
    normalizedText = normalizedText.replaceAll(
      new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"),
      " ",
    );
  }

  const filteredChunks = chunkWords(normalizedText, PAGE_CHUNK_WORDS).filter(
    (chunk) => !isBoilerplateChunk(chunk),
  );

  return filteredChunks.join(" ").replace(/\s+/g, " ").trim();
}

function chunkWords(textContent: string, chunkWordCount: number): string[] {
  const words = textContent.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += chunkWordCount) {
    chunks.push(words.slice(index, index + chunkWordCount).join(" "));
  }

  return chunks;
}

function isBoilerplateChunk(chunk: string): boolean {
  const lowerChunk = chunk.toLowerCase();
  const noiseMatches = BOILERPLATE_PHRASES.filter((phrase) =>
    lowerChunk.includes(phrase),
  ).length;
  const informativeMatches = INFORMATIVE_PHRASES.filter((phrase) =>
    lowerChunk.includes(phrase),
  ).length;
  const shortWordCount = chunk
    .split(/\s+/)
    .filter((word) => word.length <= 4).length;
  const wordCount = chunk.split(/\s+/).filter(Boolean).length;

  if (wordCount < 8) {
    return true;
  }

  if (
    /copyright|all rights reserved|privacy|cookie|accessibility|sitemap/i.test(
      chunk,
    )
  ) {
    return true;
  }

  if (noiseMatches >= 4) {
    return true;
  }

  if (noiseMatches >= 2 && informativeMatches === 0) {
    return true;
  }

  return (
    informativeMatches === 0 &&
    wordCount >= 16 &&
    !/[.!?]/.test(chunk) &&
    shortWordCount / wordCount > 0.72
  );
}

function getBatchPagePriority(url: string): number {
  try {
    const parsedUrl = new URL(url);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "") || "/";

    if (HIGH_VALUE_PATH_PATTERN.test(normalizedPath)) {
      return 0;
    }

    if (normalizedPath === "/") {
      return 10;
    }

    if (LOW_VALUE_PATH_PATTERN.test(normalizedPath)) {
      return 90;
    }

    if (NEWS_PATH_PATTERN.test(normalizedPath)) {
      return 70;
    }

    return 40;
  } catch {
    return 40;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function selectBatchPromptCrawlData(
  crawlResults: BatchPromptCrawlItem[],
): SelectedBatchPromptCrawlItem[] {
  const seenUrls = new Set<string>();
  const selectedPages: SelectedBatchPromptCrawlItem[] = [];
  const dedupedResults: Array<BatchPromptCrawlItem & { originalIndex: number }> =
    [];

  for (const [originalIndex, crawlResult] of crawlResults.entries()) {
    const normalizedUrl = normalizeCrawlUrlForBatch(crawlResult.sourceUrl);
    if (!normalizedUrl || seenUrls.has(normalizedUrl)) {
      continue;
    }

    seenUrls.add(normalizedUrl);
    dedupedResults.push({
      ...crawlResult,
      originalIndex,
    });
  }

  dedupedResults.sort((left, right) => {
    const priorityDifference =
      getBatchPagePriority(left.sourceUrl) - getBatchPagePriority(right.sourceUrl);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return left.originalIndex - right.originalIndex;
  });

  for (const crawlResult of dedupedResults) {
    const textContent = truncateBatchText(crawlResult.textContent);
    if (!textContent) {
      continue;
    }

    selectedPages.push({
      url: sanitizeUnicodeString(crawlResult.sourceUrl),
      title: sanitizeUnicodeString(crawlResult.sourceUrl),
      textContent,
    });

    if (selectedPages.length >= MAX_BATCH_CRAWL_PAGES) {
      break;
    }
  }

  return selectedPages;
}
