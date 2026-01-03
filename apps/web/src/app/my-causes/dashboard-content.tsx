import { getLikedCauses, getUserPreferences } from "@/server/db/user/queries";
import { ReflectionCard } from "@/components/reflection-card";
import { JourneyCard } from "@/components/journey-card";
import { MyCauses } from "@/components/my-causes";
import { Cause } from "@cause/types";

export async function DashboardContent({ userId }: { userId: string }) {
  // Parallel data fetching
  const [userPreferences, likedCauses] = await Promise.all([
    getUserPreferences(userId),
    getLikedCauses(userId),
  ]);

  return (
    <>
      {/* Reflection and Journey Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReflectionCard
          userPreferences={userPreferences}
          likedOrgs={likedCauses as Cause[]}
        />
        <JourneyCard likedOrgs={likedCauses as Cause[]} />
      </div>
      <MyCauses likedCauses={likedCauses as Cause[]} />
    </>
  );
}

