import {
  MAX_BATCH_CRAWL_PAGES,
  MAX_BATCH_PAGE_TEXT_CHARS,
} from "../convex/batch/constants";

export interface BatchPromptCrawlItem {
  sourceUrl: string;
  textContent?: string;
}

export interface SelectedBatchPromptCrawlItem {
  url: string;
  title: string;
  textContent: string;
}

function normalizeCrawlUrlForBatch(url: string): string {
  try {
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.hostname.toLowerCase()}${normalizedPath.toLowerCase()}`;
  } catch {
    return url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }
}

function truncateBatchText(textContent: string | undefined): string {
  const normalizedText = (textContent ?? "").trim();
  if (normalizedText.length <= MAX_BATCH_PAGE_TEXT_CHARS) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, MAX_BATCH_PAGE_TEXT_CHARS)}\n...[truncated]`;
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
      url: crawlResult.sourceUrl,
      title: crawlResult.sourceUrl,
      textContent: truncateBatchText(crawlResult.textContent),
    });

    if (selectedPages.length >= MAX_BATCH_CRAWL_PAGES) {
      break;
    }
  }

  return selectedPages;
}
