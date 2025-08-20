import { JourneyCard } from "@/components/journey-card";
import { MyCauses } from "@/components/my-causes";
import { StartOverButton } from "@/components/start-over-button";
import { ReflectionCard } from "@/components/reflection-card";
import { MockOrganization } from "@/lib/types";
import { getUserPreferences } from "@/server/db/user/queries";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MyOrgsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  const userPreferences = await getUserPreferences(userId);
  const likedOrgs: MockOrganization[] = [];

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Navigator</h1>
          <StartOverButton />
        </div>
        {/* Reflection and Journey Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReflectionCard
            userPreferences={userPreferences}
            likedOrgs={likedOrgs}
          />
          <JourneyCard likedOrgs={likedOrgs} />
        </div>
        <MyCauses />
      </div>
    </main>
  );
}
