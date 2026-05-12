"use client";

import { ReactNode } from "react";
import { AppSessionProvider } from "@/components/app-session-provider";

export function ConvexClientProvider({
  children,
  guestId,
}: {
  children: ReactNode;
  guestId?: string;
}) {
  return (
    <AppSessionProvider initialGuestId={guestId}>{children}</AppSessionProvider>
  );
}
