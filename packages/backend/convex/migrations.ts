import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";
import { internal } from "./_generated/api.js";

// Initialize migrations with type safety
export const migrations = new Migrations<DataModel>(components.migrations);

// General runner for CLI usage
export const run = migrations.runner();

/**
 * Migration: Link searchResults to organizations
 *
 * Finds the organization by ein and sets orgId
 */
export const linkSearchResults = migrations.define({
  table: "searchResults",
  customRange: (query) =>
    query.withIndex("by_ein", (q) => q.gt("ein", "")),
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
  customRange: (query) =>
    query.withIndex("by_ein", (q) => q.gt("ein", "")),
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
  customRange: (query) =>
    query.withIndex("by_ein", (q) => q.gt("ein", "")),
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
 * Run all linking migrations in order
 *
 * Usage: npx convex run migrations:runAllLinking
 */
export const runAllLinking = migrations.runner([
  internal.migrations.linkSearchResults,
  internal.migrations.linkCrawlResults,
  internal.migrations.linkAiConfirmations,
]);
