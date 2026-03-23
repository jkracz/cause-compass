"use client";

import { useQuery } from "convex/react";
import { api } from "@cause/backend/convex/_generated/api";
import { ReflectionCard } from "@/components/reflection-card";
import { JourneyCard } from "@/components/journey-card";
import { MyCauses } from "@/components/my-causes";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { useAppSession } from "@/components/app-session-provider";

export function DashboardContent() {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const likedOrgs = useQuery(
    api.organizations.getLikedByViewer,
    guestId ? { guestId } : {},
  );

  if (viewer === undefined || likedOrgs === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReflectionCard viewer={viewer} likedOrgs={likedOrgs} />
        <JourneyCard likedOrgs={likedOrgs} />
      </div>
      <MyCauses likedOrgs={likedOrgs} />
    </>
  );
}
