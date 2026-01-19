import { preloadQuery } from "convex/nextjs";
import { api } from "@cause/backend/convex/_generated/api";
import Discover from "@/components/discover";

export async function DiscoverContent({ userId }: { userId: string }) {
  const preloadedOrganizations = await preloadQuery(
    api.organizations.getRecommended,
    { limit: 10 }
  );
  return <Discover preloadedOrganizations={preloadedOrganizations} />;
}
