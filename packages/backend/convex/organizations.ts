import { query } from "./_generated/server";
import { v } from "convex/values";

// Get single org by slug (for detail page)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

// Get recommended orgs for discover page
export const getRecommended = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .take(limit);
  },
});

// Get multiple orgs by slugs (for liked causes)
export const getBySlugs = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    if (slugs.length === 0) return [];
    const orgs = await Promise.all(
      slugs.map((slug) =>
        ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first(),
      ),
    );
    return orgs.filter(Boolean);
  },
});

// Get liked organizations for a user (combined query to avoid waterfall)
export const getLikedByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!user || user.likedOrganizations.length === 0) return [];

    const orgs = await Promise.all(
      user.likedOrganizations.map((slug) =>
        ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first(),
      ),
    );
    // Filter out nulls with proper type narrowing
    return orgs.filter((org): org is NonNullable<typeof org> => org !== null);
  },
});
