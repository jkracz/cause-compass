"use client";

import { useQuery } from "convex/react";
import { api } from "@cause/backend/convex/_generated/api";
import { MyCauses } from "@/components/my-causes";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { useAppSession } from "@/components/app-session-provider";

export function DashboardContent() {
  const { guestId } = useAppSession();
  const likedOrgs = useQuery(
    api.organizations.getLikedByViewer,
    guestId ? { guestId } : {},
  );

  if (likedOrgs === undefined) {
    return <DashboardSkeleton />;
  }

  return <MyCauses likedOrgs={likedOrgs} />;
}
