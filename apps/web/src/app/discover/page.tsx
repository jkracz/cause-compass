import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DiscoverContent } from "./discover-content";
import { DiscoverSkeleton } from "./discover-skeleton";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  return (
    <main className="relative min-h-screen w-full">
      <Suspense fallback={<DiscoverSkeleton />}>
        <DiscoverContent userId={userId} />
      </Suspense>
    </main>
  );
}
