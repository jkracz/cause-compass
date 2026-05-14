import type { MetadataRoute } from "next";

export const SITE_NAME = "Cause Compass";
export const DEFAULT_TITLE =
  "Cause Compass | Discover nonprofits that match your values";
export const DEFAULT_DESCRIPTION =
  "Explore nonprofit organizations by cause, mission, and community focus so you can find organizations that match your values.";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://causecompass.org"
).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteUrl).toString();
}

export function sitemapEntry(
  path: string,
  options: Omit<MetadataRoute.Sitemap[number], "url"> = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    ...options,
  };
}
