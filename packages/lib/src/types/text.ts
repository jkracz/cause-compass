const PLACEHOLDER_TEXT = new Set(["n/a", "na", "none", "null", "undefined"]);
const PLACEHOLDER_TEXT_PATTERN =
  /^[\W_]*(?:n\s*[./\\-]?\s*a|none|null|undefined)[\W_]*$/i;

/**
 * Normalizes organization taglines and rejects values that are not meaningful
 * display copy, such as empty strings, placeholder text, or punctuation-only
 * artifacts from AI extraction.
 */
export function sanitizeTagline(value?: string | null) {
  const text = value?.trim().replace(/\s+/g, " ");

  if (!text) {
    return undefined;
  }

  if (
    PLACEHOLDER_TEXT.has(text.toLowerCase()) ||
    PLACEHOLDER_TEXT_PATTERN.test(text)
  ) {
    return undefined;
  }

  if (!/[A-Za-z0-9]/.test(text)) {
    return undefined;
  }

  return text;
}
