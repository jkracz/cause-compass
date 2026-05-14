import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  getAuthIdentity,
  getViewerRecord,
  mergeDismissedOrganizations,
  mergeLikedOrganizations,
} from "./lib/viewer";

const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  userId: v.optional(v.string()),
  guestId: v.optional(v.string()),
  likedOrganizations: v.array(v.string()),
  dismissedOrganizations: v.optional(v.array(v.string())),
});

type UserDoc = Doc<"users">;

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
) {
  const accountUser = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", authIdentity.userId))
    .first();
  const guestUser = await findGuestUser(ctx, guestId);

  if (guestUser && accountUser && guestUser._id !== accountUser._id) {
    const likedOrganizations = mergeLikedOrganizations(
      accountUser.likedOrganizations,
      guestUser.likedOrganizations,
    );
    const dismissedOrganizations = mergeDismissedOrganizations(
      accountUser.dismissedOrganizations,
      guestUser.dismissedOrganizations,
    );
    await ctx.db.patch(accountUser._id, {
      likedOrganizations,
      dismissedOrganizations,
    });
    await ctx.db.delete(guestUser._id);

    return {
      ...accountUser,
      likedOrganizations,
      dismissedOrganizations,
    } satisfies UserDoc;
  }

  if (!accountUser && guestUser) {
    await ctx.db.patch(guestUser._id, {
      userId: authIdentity.userId,
      guestId: undefined,
    });

    return {
      ...guestUser,
      userId: authIdentity.userId,
      guestId: undefined,
    } satisfies UserDoc;
  }

  if (accountUser) {
    await ctx.db.patch(accountUser._id, {});

    return {
      ...accountUser,
    } satisfies UserDoc;
  }

  const userId = await ctx.db.insert("users", {
    userId: authIdentity.userId,
    likedOrganizations: [],
    dismissedOrganizations: [],
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
          dismissedOrganizations: (user.dismissedOrganizations ?? []).filter(
            (id) => id !== organizationId,
          ),
        });
      }
      return null;
    }

    if (viewer.user) {
      if (!viewer.user.likedOrganizations.includes(organizationId)) {
        await ctx.db.patch(viewer.user._id, {
          likedOrganizations: [
            ...viewer.user.likedOrganizations,
            organizationId,
          ],
          dismissedOrganizations: (
            viewer.user.dismissedOrganizations ?? []
          ).filter((id) => id !== organizationId),
        });
      }
      return null;
    }

    if (!guestId) {
      return null;
    }

    await ctx.db.insert("users", {
      guestId,
      likedOrganizations: [organizationId],
      dismissedOrganizations: [],
    });

    return null;
  },
});

export const dismissOrganization = mutation({
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

      if (!(user.dismissedOrganizations ?? []).includes(organizationId)) {
        await ctx.db.patch(user._id, {
          dismissedOrganizations: [
            ...(user.dismissedOrganizations ?? []),
            organizationId,
          ],
        });
      }
      return null;
    }

    if (viewer.user) {
      if (
        !(viewer.user.dismissedOrganizations ?? []).includes(organizationId)
      ) {
        await ctx.db.patch(viewer.user._id, {
          dismissedOrganizations: [
            ...(viewer.user.dismissedOrganizations ?? []),
            organizationId,
          ],
        });
      }
      return null;
    }

    if (!guestId) {
      return null;
    }

    await ctx.db.insert("users", {
      guestId,
      likedOrganizations: [],
      dismissedOrganizations: [organizationId],
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

export const linkGuestToAccount = mutation({
  args: {
    guestId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { guestId }) => {
    const authIdentity = await getAuthIdentity(ctx);
    if (!authIdentity) {
      throw new Error("Authentication required");
    }

    await ensureLinkedAuthenticatedUser(ctx, guestId, authIdentity);

    return null;
  },
});
