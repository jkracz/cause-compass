import { Suspense } from "react";
import { HomeContent } from "./home-content";
import { HomeSkeleton } from "./home-skeleton";
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Cause Compass",
            description: DEFAULT_DESCRIPTION,
            url: absoluteUrl("/"),
          }),
        }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Cause Compass",
            url: absoluteUrl("/"),
            logo: absoluteUrl("/logo.png"),
            description: DEFAULT_TITLE,
          }),
        }}
      />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </>
  );
}
