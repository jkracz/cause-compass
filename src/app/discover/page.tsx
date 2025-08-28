import Discover from "@/components/discover";
import { getRecommendedCauses } from "@/server/db/organization/queries";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  const causes = userId ? await getRecommendedCauses(userId) : [];

  return (
    <main className="relative min-h-screen w-full">
      <Discover causes={causes} />
    </main>
  );
}
