/**
 * Search orchestration for finding organization websites via Google Search.
 * This module is called by the daily cron job defined in crons.ts.
 */

import { normalizeStoredSearchResults } from "@cause/types";
import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { patchOrganization } from "./aggregates";
import { googleSearch, getAvailableKeys } from "../lib/googleSearch";

const SEARCH_LIMIT_PER_KEY = 100;
const DELAY_BETWEEN_REQUESTS_MS = 100;

/**
 * Internal query to fetch organizations that need to be searched.
 * Returns orgs where enrichmentStage === "created".
 */
export const internalGetOrgsToSearch = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "created"),
      )
      .take(limit);

    return orgs.map((org) => ({
      _id: org._id,
      ein: org.ein,
      name: org.name,
      city: org.city,
      state: org.state,
    }));
  },
});

/**
 * Internal mutation to save a search result and update the organization.
 */
export const saveSearchResult = internalMutation({
  args: {
    orgId: v.id("organizations"),
    ein: v.string(),
    query: v.string(),
    resultsJson: v.string(), // JSON-stringified reduced search results
  },
  handler: async (ctx, { orgId, ein, query, resultsJson }) => {
    // Insert search result record
    await ctx.db.insert("searchResults", {
      ein,
      orgId,
      query,
      runAt: new Date().toISOString(),
      resultsJson,
    });

    // Update organization's enrichment stage
    await patchOrganization(ctx, orgId, {
      enrichmentStage: "searched",
      updatedAt: Date.now(),
    });

    // Enqueue HTML crawl job with the top search result URL
    try {
      const results = JSON.parse(resultsJson);
      if (Array.isArray(results) && results.length > 0 && results[0].link) {
        // Check for existing active crawl job (idempotent)
        const existingJob = await ctx.db
          .query("crawlQueue")
          .withIndex("by_ein_and_queueType", (q) =>
            q.eq("ein", ein).eq("queueType", "html"),
          )
          .filter((q) =>
            q.or(
              q.eq(q.field("status"), "pending"),
              q.eq(q.field("status"), "processing"),
            ),
          )
          .first();

        if (!existingJob) {
          await ctx.db.insert("crawlQueue", {
            queueType: "html",
            orgId,
            ein,
            url: results[0].link,
            status: "pending",
            attemptCount: 0,
            maxAttempts: 4,
            createdAt: Date.now(),
          });
        }
      }
    } catch {
      // If URL extraction fails, backfill cron will catch it
      console.warn(`Failed to enqueue crawl job for org ${ein}`);
    }
  },
});

/**
 * Internal mutation to mark an organization as searched even if the search failed.
 * This prevents infinite retry loops for orgs that consistently fail.
 */
export const markOrgSearched = internalMutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { orgId }) => {
    await patchOrganization(ctx, orgId, {
      enrichmentStage: "searched",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Helper to sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * Main entry point for the search job.
 * Can be called by the cron job or manually for testing.
 *
 * @param limit - Optional limit on number of orgs to search. Defaults to 400 (100 per key × 4 keys).
 *                Use limit=1 for testing in dev.
 *
 * Usage:
 *   Manual test: npx convex run searchOrgs:searchOrganizations '{"limit": 1}'
 *   Full run:    npx convex run searchOrgs:searchOrganizations
 */
export const searchOrganizations = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { limit },
  ): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    total: number;
  }> => {
    const availableKeys = getAvailableKeys();

    if (availableKeys.length === 0) {
      console.error("No Google Search API keys configured");
      return { success: false, processed: 0, errors: 0, total: 0 };
    }

    const defaultLimit = SEARCH_LIMIT_PER_KEY * availableKeys.length;
    const totalLimit = limit ?? defaultLimit;

    // Fetch orgs to search
    const orgs = await ctx.runQuery(
      internal.searchOrgs.internalGetOrgsToSearch,
      {
        limit: totalLimit,
      },
    );

    if (orgs.length === 0) {
      console.log("No organizations found with enrichmentStage='created'");
      return { success: true, processed: 0, errors: 0, total: 0 };
    }

    console.log(`Found ${orgs.length} organizations to search`);

    let processed = 0;
    let errors = 0;

    // Process orgs sequentially, rotating through API keys
    for (let i = 0; i < orgs.length; i++) {
      const org = orgs[i]!;
      const keyIndex =
        Math.floor(i / SEARCH_LIMIT_PER_KEY) % availableKeys.length;
      const keyType = availableKeys[keyIndex]!;

      const searchQuery = `${org.name} ${org.city} ${org.state}`;

      try {
        const response = await googleSearch(searchQuery, keyType);
        const normalizedResults = normalizeStoredSearchResults(
          response.items ?? [],
        );

        if (normalizedResults.issue) {
          console.warn("Search result normalization warning", {
            source: "searchOrgs.saveSearchResult",
            ein: org.ein,
            orgId: org._id,
            reason: normalizedResults.issue,
          });
        }

        await ctx.runMutation(internal.searchOrgs.saveSearchResult, {
          orgId: org._id,
          ein: org.ein,
          query: searchQuery,
          resultsJson: JSON.stringify(normalizedResults.results),
        });

        processed++;
        console.log(
          `[${i + 1}/${orgs.length}] Searched: ${org.name} (${keyType})`,
        );
      } catch (error) {
        errors++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[${i + 1}/${orgs.length}] Error searching ${org.name}: ${errorMessage}`,
        );

        // Mark as searched to prevent infinite retries
        try {
          await ctx.runMutation(internal.searchOrgs.markOrgSearched, {
            orgId: org._id,
          });
        } catch (patchError) {
          console.error(
            `Failed to mark org ${org.ein} as searched:`,
            patchError,
          );
        }
      }

      // Rate limiting delay between requests
      if (i < orgs.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      }
    }

    console.log(
      `Search complete. Processed: ${processed}, Errors: ${errors}, Total: ${orgs.length}`,
    );

    return {
      success: errors === 0,
      processed,
      errors,
      total: orgs.length,
    };
  },
});

type SearchResult = {
  success: boolean;
  processed: number;
  errors: number;
  total: number;
};

type SkippedResult = {
  skipped: true;
  reason: string;
};

/**
 * Cron wrapper that only runs in production.
 * Set ENABLE_SEARCH_CRON=true in Convex Dashboard for production deployment.
 *
 * In dev, leave this env var unset and use manual testing instead:
 *   npx convex run searchOrgs:searchOrganizations '{"limit": 1}'
 */
export const scheduledSearchOrganizations = internalAction({
  args: {},
  handler: async (ctx): Promise<SearchResult | SkippedResult> => {
    const isEnabled = process.env.ENABLE_SEARCH_CRON === "true";

    if (!isEnabled) {
      console.log(
        "Search cron is disabled (ENABLE_SEARCH_CRON !== 'true'). Skipping.",
      );
      return { skipped: true, reason: "ENABLE_SEARCH_CRON not set to true" };
    }

    return await ctx.runAction(internal.searchOrgs.searchOrganizations, {});
  },
});
