import Discover from "@/components/discover";
import { getRecommendedCauses } from "@/server/db/organization/queries";

export async function DiscoverContent({ userId }: { userId: string }) {
  const causes = await getRecommendedCauses(userId);
  return <Discover causes={causes} />;
}
