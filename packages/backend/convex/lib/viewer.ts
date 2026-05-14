import type { MutationCtx, QueryCtx } from "../_generated/server";

type ViewerCtx = QueryCtx | MutationCtx;

export async function getAuthIdentity(ctx: ViewerCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    return null;
  }

  return {
    userId: identity.subject,
  };
}

export async function getViewerRecord(ctx: ViewerCtx, guestId?: string | null) {
  const authIdentity = await getAuthIdentity(ctx);

  if (authIdentity) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", authIdentity.userId))
      .first();

    return {
      kind: "authenticated" as const,
      authIdentity,
      user,
    };
  }

  if (!guestId) {
    return {
      kind: "anonymous" as const,
      authIdentity: null,
      user: null,
    };
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
    .first();

  return {
    kind: "anonymous" as const,
    authIdentity: null,
    user,
  };
}

export function mergeLikedOrganizations(
  existingLiked: string[],
  incomingLiked: string[],
) {
  return Array.from(new Set([...existingLiked, ...incomingLiked]));
}

export function mergeDismissedOrganizations(
  existingDismissed: string[] = [],
  incomingDismissed: string[] = [],
) {
  return Array.from(new Set([...existingDismissed, ...incomingDismissed]));
}
