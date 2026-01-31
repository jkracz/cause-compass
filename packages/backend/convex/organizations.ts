import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
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

// Get orgs for carousel display (fetch extra for client-side shuffling)
export const getForCarousel = query({
  args: {},
  handler: async (ctx) => {
    // Fetch more than needed so client can shuffle and pick 30
    return await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .take(100);
  },
});

// Paginated query for infinite scroll grid
export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .paginate(paginationOpts);
  },
});

// Full-text search organizations by name
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    if (!query.trim()) return [];

    return await ctx.db
      .query("organizations")
      .withSearchIndex("search_name", (q) =>
        q.search("name", query).eq("enrichmentStage", "ready"),
      )
      .take(20);
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

// Get organizations by NTEE major category
export const getByNteeMajor = query({
  args: {
    nteeMajor: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { nteeMajor, limit = 15 }) => {
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_nteeMajor", (q) => q.eq("nteeMajor", nteeMajor))
      .collect();

    // Filter to ready orgs and take limit
    return orgs
      .filter((org) => org.enrichmentStage === "ready")
      .slice(0, limit);
  },
});

// Get organizations by geographic focus
export const getByGeographicFocus = query({
  args: {
    focus: v.union(
      v.literal("Global"),
      v.literal("National"),
      v.literal("Regional"),
      v.literal("Local"),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { focus, limit = 15 }) => {
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_geographicFocus", (q) => q.eq("geographicFocus", focus))
      .collect();

    // Filter to ready orgs and take limit
    return orgs
      .filter((org) => org.enrichmentStage === "ready")
      .slice(0, limit);
  },
});

// Get all homepage category rows in a single batched query
export const getHomePageRows = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all ready organizations once
    const allReady = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .collect();

    const limit = 15;

    // Filter into categories
    const artsAndCulture = allReady
      .filter((org) => org.nteeMajor === "A")
      .slice(0, limit);

    const education = allReady
      .filter((org) => org.nteeMajor === "B")
      .slice(0, limit);

    const healthAndWellness = allReady
      .filter((org) => org.nteeMajor === "E" || org.nteeMajor === "F")
      .slice(0, limit);

    const environmentAndAnimals = allReady
      .filter((org) => org.nteeMajor === "C" || org.nteeMajor === "D")
      .slice(0, limit);

    const globalImpact = allReady
      .filter((org) => org.geographicFocus === "Global")
      .slice(0, limit);

    const localCommunity = allReady
      .filter((org) => org.geographicFocus === "Local")
      .slice(0, limit);

    return {
      artsAndCulture,
      education,
      healthAndWellness,
      environmentAndAnimals,
      globalImpact,
      localCommunity,
    };
  },
});
