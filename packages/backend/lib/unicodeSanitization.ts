export function sanitizeUnicodeString(value: string): string {
  let sanitized = "";

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        sanitized += value.slice(index, index + 2);
        index += 1;
      }
      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      continue;
    }

    sanitized += value.charAt(index);
  }

  return sanitized;
}

export function sanitizeOptionalUnicodeString(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return sanitizeUnicodeString(value);
}

export function sanitizeUnicodeStringArray(
  values: string[] | undefined,
): string[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  return values.map(sanitizeUnicodeString);
}
