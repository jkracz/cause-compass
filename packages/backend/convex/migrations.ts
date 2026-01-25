import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";
import { internal } from "./_generated/api.js";

// Initialize migrations with type safety
export const migrations = new Migrations<DataModel>(components.migrations);

/**
 * Migration: Link searchResults to organizations
 *
 * Finds the organization by ein and sets orgId
 */
export const linkSearchResults = migrations.define({
  table: "searchResults",
  customRange: (query) => query.withIndex("by_ein", (q) => q.gt("ein", "")),
  migrateOne: async (ctx, searchResult) => {
    if (searchResult.orgId) {
      return; // Already linked
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_ein", (q) => q.eq("ein", searchResult.ein))
      .first();

    if (org) {
      return { orgId: org._id };
    }
  },
});

/**
 * Migration: Link crawlResults to organizations
 *
 * Finds the organization by ein and sets orgId
 */
export const linkCrawlResults = migrations.define({
  table: "crawlResults",
  customRange: (query) => query.withIndex("by_ein", (q) => q.gt("ein", "")),
  migrateOne: async (ctx, crawlResult) => {
    if (crawlResult.orgId) {
      return; // Already linked
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_ein", (q) => q.eq("ein", crawlResult.ein))
      .first();

    if (org) {
      return { orgId: org._id };
    }
  },
});

/**
 * Migration: Link aiConfirmations to organizations
 *
 * Finds the organization by ein and sets orgId
 */
export const linkAiConfirmations = migrations.define({
  table: "aiConfirmations",
  customRange: (query) => query.withIndex("by_ein", (q) => q.gt("ein", "")),
  migrateOne: async (ctx, aiConfirmation) => {
    if (aiConfirmation.orgId) {
      return; // Already linked
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_ein", (q) => q.eq("ein", aiConfirmation.ein))
      .first();

    if (org) {
      return { orgId: org._id };
    }
  },
});

/**
 * Migration: Populate aiConfirmations inputs field
 *
 * Finds related searchResults and crawlResults by ein and sets the inputs field
 */
export const populateAiConfirmationInputs = migrations.define({
  table: "aiConfirmations",
  customRange: (query) => query.withIndex("by_ein", (q) => q.gt("ein", "")),
  migrateOne: async (ctx, aiConfirmation) => {
    // Skip if inputs are already populated
    if (
      aiConfirmation.inputs.searchResultIds?.length ||
      aiConfirmation.inputs.crawlResultIds?.length
    ) {
      return;
    }

    // Find related searchResults by ein
    const searchResults = await ctx.db
      .query("searchResults")
      .withIndex("by_ein", (q) => q.eq("ein", aiConfirmation.ein))
      .collect();

    // Find related crawlResults by ein
    const crawlResults = await ctx.db
      .query("crawlResults")
      .withIndex("by_ein", (q) => q.eq("ein", aiConfirmation.ein))
      .collect();

    const searchResultIds = searchResults.map((sr) => sr._id);
    const crawlResultIds = crawlResults.map((cr) => cr._id);

    // Only update if we found any related records
    if (searchResultIds.length > 0 || crawlResultIds.length > 0) {
      return {
        inputs: {
          searchResultIds:
            searchResultIds.length > 0 ? searchResultIds : undefined,
          crawlResultIds:
            crawlResultIds.length > 0 ? crawlResultIds : undefined,
        },
      };
    }
  },
});

/**
 * Run all linking migrations in order
 *
 * Usage: npx convex run migrations:runAllLinking
 */
export const runAllLinking = migrations.runner([
  internal.migrations.linkSearchResults,
  internal.migrations.linkCrawlResults,
  internal.migrations.linkAiConfirmations,
  internal.migrations.populateAiConfirmationInputs,
]);
