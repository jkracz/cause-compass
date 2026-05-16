import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/my-causes"],
      },
    ],
    host: siteUrl,
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
