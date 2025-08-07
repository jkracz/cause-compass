import Discover from "@/components/discover";
import { getRecommendedOrganizations } from "@/server/db/organization/queries";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  const organizations = await getRecommendedOrganizations(userId);
  console.log("organizations", organizations);

  return (
    <main className="relative min-h-screen w-full">
      <Discover />
    </main>
  );
}
