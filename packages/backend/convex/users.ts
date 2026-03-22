import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  getAuthIdentity,
  getViewerRecord,
  mergeLikedOrganizations,
  mergePreferences,
} from "./lib/viewer";

const userPreferencesValidator = v.object({
  causes: v.optional(v.array(v.string())),
  helpMethod: v.optional(v.array(v.string())),
  changeScope: v.optional(v.string()),
  location: v.optional(v.string()),
  openEnded: v.optional(
    v.object({
      question: v.string(),
      answer: v.optional(v.string()),
    }),
  ),
});

const profileValidator = v.optional(
  v.object({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
  }),
);

const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  userId: v.optional(v.string()),
  guestId: v.optional(v.string()),
  preferences: userPreferencesValidator,
  likedOrganizations: v.array(v.string()),
  profile: profileValidator,
});

type UserDoc = Doc<"users">;

function cleanProfile(
  profile?: {
    email?: string;
    name?: string;
    picture?: string;
  } | null,
) {
  if (!profile) {
    return undefined;
  }

  return {
    email: profile.email ?? undefined,
    name: profile.name ?? undefined,
    picture: profile.picture ?? undefined,
  };
}

async function findGuestUser(ctx: MutationCtx, guestId?: string) {
  if (!guestId) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
    .first();
}

async function ensureLinkedAuthenticatedUser(
  ctx: MutationCtx,
  guestId: string | undefined,
  authIdentity: NonNullable<Awaited<ReturnType<typeof getAuthIdentity>>>,
  profileOverride?: {
    email?: string;
    name?: string;
    picture?: string;
  },
) {
  const accountUser = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", authIdentity.userId))
    .first();
  const guestUser = await findGuestUser(ctx, guestId);
  const mergedProfile = cleanProfile({
    ...authIdentity.profile,
    ...profileOverride,
  });

  if (guestUser && accountUser && guestUser._id !== accountUser._id) {
    const likedOrganizations = mergeLikedOrganizations(
      accountUser.likedOrganizations,
      guestUser.likedOrganizations,
    );
    const preferences = mergePreferences(
      accountUser.preferences,
      guestUser.preferences,
    );

    await ctx.db.patch(accountUser._id, {
      likedOrganizations,
      preferences,
      profile: mergedProfile,
    });
    await ctx.db.delete(guestUser._id);

    return {
      ...accountUser,
      likedOrganizations,
      preferences,
      profile: mergedProfile,
    } satisfies UserDoc;
  }

  if (!accountUser && guestUser) {
    await ctx.db.patch(guestUser._id, {
      userId: authIdentity.userId,
      guestId: undefined,
      profile: mergedProfile,
    });

    return {
      ...guestUser,
      userId: authIdentity.userId,
      guestId: undefined,
      profile: mergedProfile,
    } satisfies UserDoc;
  }

  if (accountUser) {
    await ctx.db.patch(accountUser._id, {
      profile: mergedProfile,
    });

    return {
      ...accountUser,
      profile: mergedProfile,
    } satisfies UserDoc;
  }

  const userId = await ctx.db.insert("users", {
    userId: authIdentity.userId,
    preferences: {},
    likedOrganizations: [],
    profile: mergedProfile,
  });

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to load linked user");
  }

  return user;
}

export const getViewer = query({
  args: { guestId: v.optional(v.string()) },
  returns: v.union(userValidator, v.null()),
  handler: async (ctx, { guestId }) => {
    const viewer = await getViewerRecord(ctx, guestId);
    if (viewer.user) {
      return viewer.user;
    }

    if (viewer.kind === "authenticated" && guestId) {
      return await ctx.db
        .query("users")
        .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
        .first();
    }

    return null;
  },
});

export const saveViewerPreferences = mutation({
  args: {
    guestId: v.optional(v.string()),
    preferences: userPreferencesValidator,
  },
  returns: v.null(),
  handler: async (ctx, { guestId, preferences }) => {
    const viewer = await getViewerRecord(ctx, guestId);

    if (viewer.kind === "authenticated" && viewer.authIdentity) {
      const user = await ensureLinkedAuthenticatedUser(
        ctx,
        guestId,
        viewer.authIdentity,
      );

      await ctx.db.patch(user._id, {
        preferences,
        profile: cleanProfile(viewer.authIdentity.profile),
      });

      return null;
    }

    if (!guestId) {
      return null;
    }

    if (viewer.user) {
      await ctx.db.patch(viewer.user._id, {
        preferences,
      });
    } else {
      await ctx.db.insert("users", {
        guestId,
        preferences,
        likedOrganizations: [],
      });
    }

    return null;
  },
});

export const likeOrganization = mutation({
  args: {
    guestId: v.optional(v.string()),
    organizationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { guestId, organizationId }) => {
    const viewer = await getViewerRecord(ctx, guestId);

    if (viewer.kind === "authenticated" && viewer.authIdentity) {
      const user = await ensureLinkedAuthenticatedUser(
        ctx,
        guestId,
        viewer.authIdentity,
      );

      if (!user.likedOrganizations.includes(organizationId)) {
        await ctx.db.patch(user._id, {
          likedOrganizations: [...user.likedOrganizations, organizationId],
        });
      }
      return null;
    }

    if (viewer.user) {
      if (!viewer.user.likedOrganizations.includes(organizationId)) {
        await ctx.db.patch(viewer.user._id, {
          likedOrganizations: [...viewer.user.likedOrganizations, organizationId],
        });
      }
      return null;
    }

    if (!guestId) {
      return null;
    }

    await ctx.db.insert("users", {
      guestId,
      preferences: {},
      likedOrganizations: [organizationId],
    });

    return null;
  },
});

export const unlikeOrganization = mutation({
  args: {
    guestId: v.optional(v.string()),
    organizationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { guestId, organizationId }) => {
    const viewer = await getViewerRecord(ctx, guestId);
    const user =
      viewer.kind === "authenticated" && viewer.authIdentity
        ? await ensureLinkedAuthenticatedUser(ctx, guestId, viewer.authIdentity)
        : viewer.user;

    if (!user) {
      return null;
    }

    await ctx.db.patch(user._id, {
      likedOrganizations: user.likedOrganizations.filter(
        (id) => id !== organizationId,
      ),
    });

    return null;
  },
});

export const resetViewerPreferences = mutation({
  args: { guestId: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, { guestId }) => {
    const viewer = await getViewerRecord(ctx, guestId);
    const user =
      viewer.kind === "authenticated" && viewer.authIdentity
        ? await ensureLinkedAuthenticatedUser(ctx, guestId, viewer.authIdentity)
        : viewer.user;

    if (!user) {
      return false;
    }

    await ctx.db.patch(user._id, {
      preferences: {},
    });

    return true;
  },
});

export const linkGuestToAccount = mutation({
  args: {
    guestId: v.optional(v.string()),
    profile: v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      picture: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { guestId, profile }) => {
    const authIdentity = await getAuthIdentity(ctx);
    if (!authIdentity) {
      throw new Error("Authentication required");
    }

    await ensureLinkedAuthenticatedUser(ctx, guestId, authIdentity, profile);

    return null;
  },
});
