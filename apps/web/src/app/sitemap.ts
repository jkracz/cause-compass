import type { MetadataRoute } from "next";
import { BROWSE_CATEGORIES } from "@/lib/browse-categories";
import { sitemapEntry } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    sitemapEntry("/", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    }),
    sitemapEntry("/discover", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    sitemapEntry("/about", {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }),
    ...BROWSE_CATEGORIES.map((category) =>
      sitemapEntry(`/browse/${category.slug}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: category.prominence === "featured" ? 0.85 : 0.75,
      }),
    ),
    sitemapEntry("/privacy", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    }),
    sitemapEntry("/terms", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    }),
  ];
}
