/**
 * Internal queries for batch processing.
 */

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import type {
  OrgForAiConfirmation,
  OrgForAiConfirmationBase,
  CrawlItemData,
} from "./types";
import { selectBatchPromptCrawlData } from "../../lib/batchPromptSelection";
import {
  sanitizeOptionalUnicodeString,
  sanitizeUnicodeString,
  sanitizeUnicodeStringArray,
} from "../../lib/unicodeSanitization";

/**
 * Get organization metadata ready for AI confirmation.
 */
export const internalListOrgsForAiConfirmation = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }): Promise<OrgForAiConfirmationBase[]> => {
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "crawled"),
      )
      .take(limit);

    return orgs.map((org) => ({
      _id: org._id,
      ein: sanitizeUnicodeString(org.ein),
      name: sanitizeUnicodeString(org.name),
      street: sanitizeUnicodeString(org.street),
      city: sanitizeUnicodeString(org.city),
      state: sanitizeUnicodeString(org.state),
      nteeCode: sanitizeOptionalUnicodeString(org.nteeCode),
    }));
  },
});

/**
 * Get selected crawl data used in the batch prompt for a single EIN.
 */
export const internalGetSelectedCrawlDataForEin = internalQuery({
  args: { ein: v.string() },
  handler: async (ctx, { ein }): Promise<OrgForAiConfirmation["crawlData"]> => {
    const crawlResults = await ctx.db
      .query("crawlResults")
      .withIndex("by_ein", (q) => q.eq("ein", ein))
      .collect();

    return selectBatchPromptCrawlData(crawlResults);
  },
});

/**
 * Get organization by EIN for result processing.
 */
export const internalGetOrgByEin = internalQuery({
  args: { ein: v.string() },
  handler: async (ctx, { ein }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_ein", (q) => q.eq("ein", ein))
      .first();
  },
});

/**
 * Get crawl results by EIN for result processing.
 * Returns crawl data needed for extracting social media, logos, donation links.
 */
export const internalGetCrawlResultsByEin = internalQuery({
  args: { ein: v.string() },
  handler: async (ctx, { ein }): Promise<CrawlItemData[]> => {
    const crawlResults = await ctx.db
      .query("crawlResults")
      .withIndex("by_ein", (q) => q.eq("ein", ein))
      .collect();

    return crawlResults.map((cr) => ({
      sourceUrl: sanitizeUnicodeString(cr.sourceUrl),
      textContent: sanitizeOptionalUnicodeString(cr.textContent),
      aboutLinks: sanitizeUnicodeStringArray(cr.aboutLinks),
      donationLinks: sanitizeUnicodeStringArray(cr.donationLinks),
      socialMediaUrls: sanitizeUnicodeStringArray(cr.socialMediaUrls),
      logoLinks: sanitizeUnicodeStringArray(cr.logoLinks),
      emailAddresses: sanitizeUnicodeStringArray(cr.emailAddresses),
    }));
  },
});
