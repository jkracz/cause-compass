import { Migrations } from "@convex-dev/migrations";
import { normalizeStoredSearchResults } from "@cause/lib";
import { v } from "convex/values";
import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";
import { internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";
import { patchOrganization } from "./aggregates.js";

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
 * Migration: Shrink stored search result payloads
 *
 * Rewrites raw Google results into the reduced stored array shape.
 */
export const shrinkSearchResultsPayloads = migrations.define({
  table: "searchResults",
  customRange: (query) => query.withIndex("by_ein", (q) => q.gt("ein", "")),
  migrateOne: async (_ctx, searchResult) => {
    let parsedResults: unknown;

    try {
      parsedResults = JSON.parse(searchResult.resultsJson);
    } catch {
      console.warn("Search result migration warning", {
        source: "migrations.shrinkSearchResultsPayloads",
        _id: searchResult._id,
        ein: searchResult.ein,
        orgId: searchResult.orgId,
        reason: "invalid_json",
      });
      return;
    }

    const normalizedResults = normalizeStoredSearchResults(parsedResults);
    if (normalizedResults.issue === "invalid_shape") {
      console.warn("Search result migration warning", {
        source: "migrations.shrinkSearchResultsPayloads",
        _id: searchResult._id,
        ein: searchResult.ein,
        orgId: searchResult.orgId,
        reason: normalizedResults.issue,
      });
      return;
    }

    if (normalizedResults.issue) {
      console.warn("Search result migration warning", {
        source: "migrations.shrinkSearchResultsPayloads",
        _id: searchResult._id,
        ein: searchResult.ein,
        orgId: searchResult.orgId,
        reason: normalizedResults.issue,
      });
    }

    const nextResultsJson = JSON.stringify(normalizedResults.results);
    if (nextResultsJson === searchResult.resultsJson) {
      return;
    }

    return {
      resultsJson: nextResultsJson,
    };
  },
});

/**
 * Migration: Promote ai_confirmed orgs with a confirmed website to ready
 *
 * Only advances organizations when an AI confirmation explicitly marked the
 * website as correct and included a URL.
 */
export const promoteConfirmedOrgsToReady = migrations.define({
  table: "organizations",
  customRange: (query) =>
    query.withIndex("by_enrichmentStage", (q) =>
      q.eq("enrichmentStage", "ai_confirmed"),
    ),
  migrateOne: async (ctx, organization) => {
    const confirmations = await ctx.db
      .query("aiConfirmations")
      .withIndex("by_ein", (q) => q.eq("ein", organization.ein))
      .collect();

    const latestConfirmedWebsite = confirmations
      .filter(
        (confirmation) =>
          confirmation.outputs.hasCorrectWebsite &&
          !!confirmation.outputs.correctWebsiteUrl,
      )
      .sort((a, b) => b.runAt.localeCompare(a.runAt))[0];

    if (!latestConfirmedWebsite?.outputs.correctWebsiteUrl) {
      return;
    }

    const confirmedWebsiteUrl = latestConfirmedWebsite.outputs.correctWebsiteUrl;

    if (
      organization.enrichmentStage === "ready" &&
      organization.websiteUrl === confirmedWebsiteUrl
    ) {
      return;
    }

    return {
      enrichmentStage: "ready" as const,
      websiteUrl: confirmedWebsiteUrl,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Migration: Advance searched orgs to crawled when no active crawl jobs remain
 *
 * Fixes orgs stuck in "searched" due to the escalation retry bug where HTML
 * jobs were retried after escalating to browser, preventing the org from ever
 * transitioning to "crawled".
 */
export const advanceSettledSearchedOrgs = migrations.define({
  table: "organizations",
  customRange: (query) =>
    query.withIndex("by_enrichmentStage", (q) =>
      q.eq("enrichmentStage", "searched"),
    ),
  migrateOne: async (ctx, org) => {
    // Check for any active crawl jobs (pending or processing)
    const pendingHtml = await ctx.db
      .query("crawlQueue")
      .withIndex("by_orgId_and_status", (q) =>
        q.eq("orgId", org._id).eq("status", "pending"),
      )
      .first();
    if (pendingHtml) return;

    const processingHtml = await ctx.db
      .query("crawlQueue")
      .withIndex("by_orgId_and_status", (q) =>
        q.eq("orgId", org._id).eq("status", "processing"),
      )
      .first();
    if (processingHtml) return;

    const completedJob = await ctx.db
      .query("crawlQueue")
      .withIndex("by_orgId_and_status", (q) =>
        q.eq("orgId", org._id).eq("status", "completed"),
      )
      .first();
    const failedJob = await ctx.db
      .query("crawlQueue")
      .withIndex("by_orgId_and_status", (q) =>
        q.eq("orgId", org._id).eq("status", "failed"),
      )
      .first();

    // Only advance orgs that actually have crawl queue history.
    if (!completedJob && !failedJob) return;

    // No active jobs and crawl work has settled — advance to crawled.
    return {
      enrichmentStage: "crawled" as const,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Run the searched → crawled advancement migration.
 *
 * This runner intentionally uses patchOrganization instead of
 * @convex-dev/migrations's returned patch object so orgStageAggregate stays in
 * sync with organization stage changes.
 *
 * Usage: npx convex run migrations:runAdvanceSettledSearchedOrgs '{"cursor": null}'
 */
export const runAdvanceSettledSearchedOrgs = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const result = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "searched"),
      )
      .paginate({ numItems: 100, cursor });

    for (const org of result.page) {
      const pendingJob = await ctx.db
        .query("crawlQueue")
        .withIndex("by_orgId_and_status", (q) =>
          q.eq("orgId", org._id).eq("status", "pending"),
        )
        .first();
      if (pendingJob) {
        continue;
      }

      const processingJob = await ctx.db
        .query("crawlQueue")
        .withIndex("by_orgId_and_status", (q) =>
          q.eq("orgId", org._id).eq("status", "processing"),
        )
        .first();
      if (processingJob) {
        continue;
      }

      const completedJob = await ctx.db
        .query("crawlQueue")
        .withIndex("by_orgId_and_status", (q) =>
          q.eq("orgId", org._id).eq("status", "completed"),
        )
        .first();
      const failedJob = await ctx.db
        .query("crawlQueue")
        .withIndex("by_orgId_and_status", (q) =>
          q.eq("orgId", org._id).eq("status", "failed"),
        )
        .first();

      if (!completedJob && !failedJob) {
        continue;
      }

      await patchOrganization(ctx, org._id, {
        enrichmentStage: "crawled",
        updatedAt: Date.now(),
      });
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.runAdvanceSettledSearchedOrgs,
        { cursor: result.continueCursor },
      );
    }

    return null;
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

/**
 * Run the search result payload shrink migration
 *
 * Usage: npx convex run migrations:runSearchResultStorageShrink
 */
export const runSearchResultStorageShrink = migrations.runner(
  internal.migrations.shrinkSearchResultsPayloads,
);

/**
 * Promote already-confirmed organizations to ready.
 *
 * This runner intentionally uses patchOrganization instead of
 * @convex-dev/migrations's returned patch object so orgStageAggregate stays in
 * sync with organization stage changes.
 *
 * Usage: npx convex run migrations:runPromoteConfirmedOrgsToReady '{"cursor": null}'
 */
export const runPromoteConfirmedOrgsToReady = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const result = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "ai_confirmed"),
      )
      .paginate({ numItems: 100, cursor });

    for (const organization of result.page) {
      const confirmations = await ctx.db
        .query("aiConfirmations")
        .withIndex("by_ein", (q) => q.eq("ein", organization.ein))
        .collect();

      const latestConfirmedWebsite = confirmations
        .filter(
          (confirmation) =>
            confirmation.outputs.hasCorrectWebsite &&
            !!confirmation.outputs.correctWebsiteUrl,
        )
        .sort((a, b) => b.runAt.localeCompare(a.runAt))[0];

      if (!latestConfirmedWebsite?.outputs.correctWebsiteUrl) {
        continue;
      }

      await patchOrganization(ctx, organization._id, {
        enrichmentStage: "ready",
        websiteUrl: latestConfirmedWebsite.outputs.correctWebsiteUrl,
        updatedAt: Date.now(),
      });
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.runPromoteConfirmedOrgsToReady,
        { cursor: result.continueCursor },
      );
    }

    return null;
  },
});
