import type { MutationCtx, QueryCtx } from "../_generated/server";

type ViewerCtx = QueryCtx | MutationCtx;

export const LOCATION_SENTINELS = new Set(["skipped", "denied", "unavailable"]);

export async function getAuthIdentity(ctx: ViewerCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    return null;
  }

  return {
    userId: identity.subject,
    profile: {
      email: typeof identity.email === "string" ? identity.email : undefined,
      name: typeof identity.name === "string" ? identity.name : undefined,
      picture:
        typeof identity.picture === "string" ? identity.picture : undefined,
    },
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

export function mergePreferences(
  existing: {
    causes?: string[];
    helpMethod?: string[];
    changeScope?: string;
    location?: string;
    openEnded?: {
      question: string;
      answer?: string;
    };
  },
  incoming: {
    causes?: string[];
    helpMethod?: string[];
    changeScope?: string;
    location?: string;
    openEnded?: {
      question: string;
      answer?: string;
    };
  },
) {
  const merged = { ...existing };

  if (incoming.causes && incoming.causes.length > 0) {
    merged.causes = incoming.causes;
  }

  if (incoming.helpMethod && incoming.helpMethod.length > 0) {
    merged.helpMethod = incoming.helpMethod;
  }

  if (incoming.changeScope?.trim()) {
    merged.changeScope = incoming.changeScope.trim();
  }

  if (
    incoming.location?.trim() &&
    !LOCATION_SENTINELS.has(incoming.location.trim())
  ) {
    merged.location = incoming.location.trim();
  }

  if (incoming.openEnded?.answer?.trim()) {
    merged.openEnded = {
      question: incoming.openEnded.question,
      answer: incoming.openEnded.answer.trim(),
    };
  }

  return merged;
}
