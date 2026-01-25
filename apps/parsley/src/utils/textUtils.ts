/**
 * Text processing utilities for handling large content.
 */

/**
 * Maximum text content length for crawl results.
 * Set to 750KB to stay safely under Convex's 1 MiB document limit.
 */
export const MAX_TEXT_CONTENT_LENGTH = 750_000;

/**
 * Maximum total size for string array fields (in characters).
 * Set to 100KB to prevent any single array from dominating document size.
 */
export const MAX_ARRAY_TOTAL_SIZE = 100_000;

/**
 * Truncates text content if it exceeds the maximum length.
 * Appends a marker to indicate truncation occurred.
 *
 * @param text - The text content to potentially truncate
 * @returns The original text if under limit, or truncated text with marker
 */
export function truncateTextContent(
  text: string | undefined,
): string | undefined {
  if (!text) return text;
  if (text.length <= MAX_TEXT_CONTENT_LENGTH) return text;
  return (
    text.slice(0, MAX_TEXT_CONTENT_LENGTH) +
    "\n\n[Content truncated for storage]"
  );
}

/**
 * Limits a string array by total character count.
 * Keeps items until the total size exceeds the limit.
 *
 * @param arr - The string array to limit
 * @param maxTotalSize - Maximum total characters (default: MAX_ARRAY_TOTAL_SIZE)
 * @returns The limited array, or undefined if input is undefined/empty
 */
export function limitArrayBySize(
  arr: string[] | undefined,
  maxTotalSize: number = MAX_ARRAY_TOTAL_SIZE,
): string[] | undefined {
  if (!arr || arr.length === 0) return arr;

  const result: string[] = [];
  let totalSize = 0;

  for (const item of arr) {
    const itemSize = item.length;
    if (totalSize + itemSize > maxTotalSize) {
      break;
    }
    result.push(item);
    totalSize += itemSize;
  }

  return result.length > 0 ? result : undefined;
}
