import { preloadQuery } from "convex/nextjs";
import { api } from "@cause/backend/convex/_generated/api";
import { ReflectionCard } from "@/components/reflection-card";
import { JourneyCard } from "@/components/journey-card";
import { MyCauses } from "@/components/my-causes";

export async function DashboardContent({ userId }: { userId: string }) {
  // Preload user and liked organizations in parallel
  const [preloadedUser, preloadedLikedOrgs] = await Promise.all([
    preloadQuery(api.users.getOne, { userId }),
    preloadQuery(api.organizations.getLikedByUser, { userId }),
  ]);

  return (
    <>
      {/* Reflection and Journey Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReflectionCard
          preloadedUser={preloadedUser}
          preloadedLikedOrgs={preloadedLikedOrgs}
        />
        <JourneyCard preloadedLikedOrgs={preloadedLikedOrgs} />
      </div>
      <MyCauses preloadedLikedOrgs={preloadedLikedOrgs} />
    </>
  );
}
