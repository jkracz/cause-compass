"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import posthog from "posthog-js";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";

export function useResetPreferences() {
  const router = useRouter();
  const session = useAppSession();
  const resetViewerPreferences = useMutation(api.users.resetViewerPreferences);
  const [isPending, setIsPending] = useState(false);

  const resetPreferences = async () => {
    setIsPending(true);

    try {
      await resetViewerPreferences({
        guestId: session.guestId,
      });

      posthog.capture("journey_reset", {
        mode: session.isAuthenticated ? "authenticated" : "guest",
      });

      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return {
    isPending,
    isAuthenticated: session.isAuthenticated,
    resetPreferences,
  };
}
