"use client";

import { ReactNode } from "react";
import { AppSessionProvider } from "@/components/app-session-provider";
import { LocationPreferenceProvider } from "@/components/location-preference-provider";

export function ConvexClientProvider({
  children,
  guestId,
}: {
  children: ReactNode;
  guestId?: string;
}) {
  return (
    <AppSessionProvider initialGuestId={guestId}>
      <LocationPreferenceProvider>{children}</LocationPreferenceProvider>
    </AppSessionProvider>
  );
}
