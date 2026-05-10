const PLACEHOLDER_TEXT = new Set(["n/a", "na", "none", "null", "undefined"]);

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

  if (PLACEHOLDER_TEXT.has(text.toLowerCase())) {
    return undefined;
  }

  if (!/[A-Za-z0-9]/.test(text)) {
    return undefined;
  }

  return text;
}
