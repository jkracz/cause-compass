/**
 * Internal queries for batch processing.
 */

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import type { OrgForAiConfirmation, CrawlItemData } from "./types";
import { selectBatchPromptCrawlData } from "../../lib/batchPromptSelection";

/**
 * Get organizations ready for AI confirmation.
 * Returns orgs that have been crawled but not yet processed by AI.
 */
export const internalGetOrgsForAiConfirmation = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }): Promise<OrgForAiConfirmation[]> => {
    // Get organizations in "crawled" stage (have search + crawl results but no AI confirmation)
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "crawled"),
      )
      .take(limit);

    // For each org, fetch the associated crawl results
    const orgsWithCrawlData: OrgForAiConfirmation[] = await Promise.all(
      orgs.map(async (org): Promise<OrgForAiConfirmation> => {
        const crawlResults = await ctx.db
          .query("crawlResults")
          .withIndex("by_ein", (q) => q.eq("ein", org.ein))
          .collect();

        return {
          _id: org._id,
          ein: org.ein,
          name: org.name,
          street: org.street,
          city: org.city,
          state: org.state,
          nteeCode: org.nteeCode,
          crawlData: selectBatchPromptCrawlData(crawlResults),
        };
      }),
    );

    // Filter out orgs with no crawl data
    return orgsWithCrawlData.filter((org) => org.crawlData.length > 0);
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
      sourceUrl: cr.sourceUrl,
      textContent: cr.textContent,
      aboutLinks: cr.aboutLinks,
      donationLinks: cr.donationLinks,
      socialMediaUrls: cr.socialMediaUrls,
      logoLinks: cr.logoLinks,
      emailAddresses: cr.emailAddresses,
    }));
  },
});
