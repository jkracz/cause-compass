"use client";

import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import type { AuthClient as ConvexBetterAuthClient } from "@convex-dev/better-auth/react";

export const authClient = createAuthClient({
  plugins: [convexClient()],
});

// @convex-dev/better-auth 0.12.4 narrows this provider prop under
// better-auth 1.6.19, but the runtime client has the required convex plugin.
export const convexAuthClient = authClient as unknown as ConvexBetterAuthClient;
