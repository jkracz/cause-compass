import { Suspense } from "react";
import { DiscoverContent } from "./discover-content";
import { DiscoverSkeleton } from "./discover-skeleton";

export default function DiscoverPage() {
  return (
    <main className="relative min-h-screen w-full">
      <Suspense fallback={<DiscoverSkeleton />}>
        <DiscoverContent />
      </Suspense>
    </main>
  );
}
