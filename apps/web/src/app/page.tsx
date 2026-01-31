import { Suspense } from "react";
import { HomeContent } from "./home-content";
import { HomeSkeleton } from "./home-skeleton";

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
