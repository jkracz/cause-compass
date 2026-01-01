import { Suspense } from "react";
import { StartOverButton } from "@/components/start-over-button";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { preloadQuery } from "convex/nextjs";
import { api } from "@cause/backend/convex/_generated/api";

export default async function MyOrgsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/onboarding");
  }
  const preloadedUser = await preloadQuery(api.users.getOne, {
    userId,
  });

  const likedCauses: Cause[] = await getLikedCauses(userId);

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header - Always visible */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Navigator</h1>
          <StartOverButton />
        </div>

        {/* Content loaded via Suspense */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent userId={userId} />
        </Suspense>
      </div>
    </main>
  );
}
