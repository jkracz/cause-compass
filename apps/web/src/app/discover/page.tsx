import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverContent } from "./discover-content";
import { DiscoverSkeleton } from "./discover-skeleton";

export const metadata: Metadata = {
  title: "Discover Nonprofits",
  description:
    "Search and explore nonprofit organizations by cause, mission, location, and scale.",
  alternates: {
    canonical: "/discover",
  },
};

export default function DiscoverPage() {
  return (
    <main className="relative min-h-screen w-full">
      <Suspense fallback={<DiscoverSkeleton />}>
        <DiscoverContent />
      </Suspense>
    </main>
  );
}
