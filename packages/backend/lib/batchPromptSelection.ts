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
  const normalizedText = sanitizeBatchText(textContent ?? "");
  if (normalizedText.length <= MAX_BATCH_PAGE_TEXT_CHARS) {
    return normalizedText;
  }

  const truncatedText = sanitizeBatchText(
    normalizedText.slice(0, MAX_BATCH_PAGE_TEXT_CHARS),
  );
  return `${truncatedText}\n...[truncated]`;
}

function sanitizeBatchText(textContent: string): string {
  const sanitizedText = sanitizeUnicodeString(textContent).trim();
  return sanitizedText.replace(INCOMPLETE_ESCAPE_SUFFIX, "");
}

export function selectBatchPromptCrawlData(
  crawlResults: BatchPromptCrawlItem[],
): SelectedBatchPromptCrawlItem[] {
  const seenUrls = new Set<string>();
  const selectedPages: SelectedBatchPromptCrawlItem[] = [];

  for (const crawlResult of crawlResults) {
    const normalizedUrl = normalizeCrawlUrlForBatch(crawlResult.sourceUrl);
    if (!normalizedUrl || seenUrls.has(normalizedUrl)) {
      continue;
    }

    seenUrls.add(normalizedUrl);
    selectedPages.push({
      url: sanitizeUnicodeString(crawlResult.sourceUrl),
      title: sanitizeUnicodeString(crawlResult.sourceUrl),
      textContent: truncateBatchText(crawlResult.textContent),
    });

    if (selectedPages.length >= MAX_BATCH_CRAWL_PAGES) {
      break;
    }
  }

  return selectedPages;
}
