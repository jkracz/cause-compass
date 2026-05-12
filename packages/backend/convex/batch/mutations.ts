/**
 * Internal mutations for batch processing.
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { patchOrganization } from "../aggregates";

/**
 * Update organization with AI confirmation results.
 */
export const internalUpdateOrgWithAiResults = internalMutation({
  args: {
    orgId: v.id("organizations"),
    updates: v.object({
      websiteUrl: v.optional(v.string()),
      mission: v.optional(v.string()),
      tagline: v.optional(v.string()),
      oneSentenceSummary: v.optional(v.string()),
      whySupport: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      geographicFocus: v.optional(
        v.union(
          v.literal("Global"),
          v.literal("National"),
          v.literal("Regional"),
          v.literal("Local"),
        ),
      ),
      activities: v.optional(
        v.array(
          v.object({
            name: v.string(),
            description: v.string(),
          }),
        ),
      ),
      keywords: v.optional(v.array(v.string())),
      // Crawl-extracted fields
      socialMediaUrls: v.optional(
        v.object({
          linkedin: v.optional(v.string()),
          youtube: v.optional(v.string()),
          x: v.optional(v.string()),
          instagram: v.optional(v.string()),
          threads: v.optional(v.string()),
          facebook: v.optional(v.string()),
          twitter: v.optional(v.string()),
        }),
      ),
      donationUrl: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      emailAddresses: v.optional(v.array(v.string())),
      enrichmentStage: v.optional(
        v.union(
          v.literal("created"),
          v.literal("searched"),
          v.literal("uncrawlable"),
          v.literal("crawled"),
          v.literal("local_ai_reviewed"),
          v.literal("ai_confirmed"),
          v.literal("ready"),
        ),
      ),
    }),
  },
  handler: async (ctx, { orgId, updates }) => {
    await patchOrganization(ctx, orgId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Insert AI confirmation record.
 */
export const internalInsertAiConfirmation = internalMutation({
  args: {
    ein: v.string(),
    orgId: v.id("organizations"),
    model: v.string(),
    outputs: v.object({
      hasCorrectWebsite: v.boolean(),
      correctWebsiteUrl: v.optional(v.string()),
      mission: v.optional(v.string()),
      tagline: v.optional(v.string()),
      oneSentenceSummary: v.optional(v.string()),
      whySupport: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      geographicFocus: v.optional(v.string()),
      activityTags: v.optional(
        v.array(
          v.object({
            name: v.string(),
            description: v.string(),
          }),
        ),
      ),
      reasoning: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { ein, orgId, model, outputs }) => {
    await ctx.db.insert("aiConfirmations", {
      ein,
      orgId,
      model,
      runAt: new Date().toISOString(),
      inputs: {
        searchResultIds: [],
        crawlResultIds: [],
      },
      outputs,
    });
  },
});
