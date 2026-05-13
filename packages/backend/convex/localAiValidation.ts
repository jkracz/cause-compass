import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { patchOrganization } from "./aggregates";
import { WebsiteConfirmationSchema } from "@cause/lib";
import { selectBatchPromptCrawlData } from "../lib/batchPromptSelection";
import { buildAiConfirmationApplication } from "../lib/aiConfirmationApplication";
import {
  sanitizeOptionalUnicodeString,
  sanitizeUnicodeString,
  sanitizeUnicodeStringArray,
} from "../lib/unicodeSanitization";

declare const process: {
  env: Record<string, string | undefined>;
};

const localAiResultValidator = v.object({
  hasCorrectWebsite: v.boolean(),
  correctWebsiteUrl: v.union(v.string(), v.null()),
  reasoning: v.string(),
  organizationOneSentenceSummary: v.union(v.string(), v.null()),
  whySupportOrganization: v.union(v.string(), v.null()),
  organizationMission: v.union(v.string(), v.null()),
  organizationTagline: v.union(v.string(), v.null()),
  organizationUniqueTrait: v.union(v.string(), v.null()),
  organizationTargetAudience: v.union(v.string(), v.null()),
  organizationGeographicFocus: v.union(
    v.literal("Global"),
    v.literal("Local"),
    v.literal("National"),
    v.literal("Regional"),
    v.null(),
  ),
  organizationActivities: v.union(
    v.array(v.object({ name: v.string(), description: v.string() })),
    v.null(),
  ),
  organizationKeywords: v.union(v.array(v.string()), v.null()),
});

function requireLocalAiToken(token: string): void {
  const expectedToken = process.env.LOCAL_AI_OPERATOR_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    throw new Error("Unauthorized local AI operator token");
  }
}

/**
 * Loads the raw crawl pages for one organization so callers can either build a
 * prompt preview or derive enrichment data from the confirmed website.
 */
async function getCrawlResultsForEin(ctx: QueryCtx | MutationCtx, ein: string) {
  return await ctx.db
    .query("crawlResults")
    .withIndex("by_ein", (q) => q.eq("ein", ein))
    .collect();
}

/**
 * Returns one page of crawled organizations plus the selected crawl text needed
 * by the local AI runner to build its confirmation prompt.
 */
export const listCandidates = query({
  args: {
    operatorToken: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { operatorToken, paginationOpts }) => {
    requireLocalAiToken(operatorToken);

    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "crawled"),
      )
      .paginate(paginationOpts);

    return {
      ...orgs,
      page: await Promise.all(
        orgs.page.map(async (org) => {
          const crawlResults = await getCrawlResultsForEin(ctx, org.ein);
          return {
            _id: org._id,
            ein: sanitizeUnicodeString(org.ein),
            name: sanitizeUnicodeString(org.name),
            street: sanitizeUnicodeString(org.street),
            city: sanitizeUnicodeString(org.city),
            state: sanitizeUnicodeString(org.state),
            nteeCode: sanitizeOptionalUnicodeString(org.nteeCode),
            crawlData: selectBatchPromptCrawlData(crawlResults),
          };
        }),
      ),
    };
  },
});

/**
 * Moves crawled organizations out of the local AI queue when their stored crawl
 * results cannot produce prompt-ready validation text.
 */
export const markUnverifiable = mutation({
  args: {
    operatorToken: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { operatorToken, orgId }) => {
    requireLocalAiToken(operatorToken);

    const org = await ctx.db.get(orgId);
    if (!org || org.enrichmentStage !== "crawled") {
      throw new Error("Local AI target is no longer eligible");
    }

    const crawlResults = await getCrawlResultsForEin(ctx, org.ein);
    if (selectBatchPromptCrawlData(crawlResults).length > 0) {
      throw new Error("Local AI target still has prompt-ready crawl data");
    }

    await patchOrganization(ctx, orgId, {
      enrichmentStage: "unverifiable",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      enrichmentStage: "unverifiable" as const,
    };
  },
});

/**
 * Persists one validated local AI result, records provenance, and advances the
 * organization to `ready` or `local_ai_reviewed`.
 */
export const commitResult = mutation({
  args: {
    operatorToken: v.string(),
    orgId: v.id("organizations"),
    model: v.string(),
    result: localAiResultValidator,
  },
  handler: async (ctx, { operatorToken, orgId, model, result }) => {
    requireLocalAiToken(operatorToken);

    const org = await ctx.db.get(orgId);
    if (!org || org.enrichmentStage !== "crawled") {
      throw new Error("Local AI target is no longer eligible");
    }

    const parseResult = WebsiteConfirmationSchema.safeParse(result);
    if (!parseResult.success) {
      throw new Error(`Invalid local AI result: ${parseResult.error.message}`);
    }

    const rawCrawlResults = await getCrawlResultsForEin(ctx, org.ein);
    const crawlResults = rawCrawlResults.map((crawlResult) => ({
      sourceUrl: sanitizeUnicodeString(crawlResult.sourceUrl),
      textContent: sanitizeOptionalUnicodeString(crawlResult.textContent),
      aboutLinks: sanitizeUnicodeStringArray(crawlResult.aboutLinks),
      donationLinks: sanitizeUnicodeStringArray(crawlResult.donationLinks),
      socialMediaUrls: sanitizeUnicodeStringArray(crawlResult.socialMediaUrls),
      logoLinks: sanitizeUnicodeStringArray(crawlResult.logoLinks),
      emailAddresses: sanitizeUnicodeStringArray(crawlResult.emailAddresses),
    }));
    const application = buildAiConfirmationApplication({
      confirmation: parseResult.data,
      crawlResults,
      fallbackStage: "local_ai_reviewed",
    });

    await ctx.db.insert("aiConfirmations", {
      ein: org.ein,
      orgId,
      model,
      runAt: new Date().toISOString(),
      inputs: {
        searchResultIds: [],
        crawlResultIds: rawCrawlResults.map((crawlResult) => crawlResult._id),
      },
      outputs: application.outputs,
    });
    await patchOrganization(ctx, orgId, {
      ...application.updates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      enrichmentStage: application.updates.enrichmentStage,
    };
  },
});
