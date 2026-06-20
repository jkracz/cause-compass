import { CodexResearchResultSchema, type CodexResearchResult } from "@cause/lib";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { enqueueCrawlJob } from "./crawlQueue";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { patchOrganization } from "./aggregates";
import {
  buildCodexResearchOutputs,
  buildCodexResearchReadyUpdates,
  type CodexResearchMode,
} from "../lib/codexResearchApplication";
import { isEligibleCrawlCandidateUrl } from "../lib/crawlCandidates";
import {
  sanitizeOptionalUnicodeString,
  sanitizeUnicodeString,
  sanitizeUnicodeStringArray,
} from "../lib/unicodeSanitization";

declare const process: {
  env: Record<string, string | undefined>;
};

const researchModeValidator = v.union(
  v.literal("enqueue_crawl"),
  v.literal("promote_ready"),
);

const researchStatusValidator = v.union(
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("timed_out"),
  v.literal("schema_invalid"),
);

const inputSnapshotValidator = v.object({
  name: v.string(),
  street: v.string(),
  city: v.string(),
  state: v.string(),
  zip: v.optional(v.string()),
  nteeCode: v.optional(v.string()),
  activityCodes: v.optional(v.array(v.string())),
  assetBucket: v.optional(v.string()),
  incomeBucket: v.optional(v.string()),
  ico: v.optional(v.string()),
});

const usageValidator = v.object({
  inputTokens: v.optional(v.number()),
  cachedInputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  reasoningOutputTokens: v.optional(v.number()),
});

function requireLocalAiToken(token: string): void {
  const expectedToken = process.env.LOCAL_AI_OPERATOR_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    throw new Error("Unauthorized local AI operator token");
  }
}

function getDisplayLink(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function buildStoredSearchResults(result: CodexResearchResult) {
  const seen = new Set<string>();

  return result.candidateUrls
    .filter((candidate) => {
      if (seen.has(candidate.url)) {
        return false;
      }
      seen.add(candidate.url);
      return true;
    })
    .slice(0, 10)
    .map((candidate, index) => ({
      rank: index + 1,
      link: candidate.url,
      title: `Codex ${candidate.purpose.replaceAll("_", " ")} candidate`,
      snippet: candidate.evidence,
      displayLink: getDisplayLink(candidate.url),
    }));
}

function shouldEnqueueCandidate(
  result: CodexResearchResult,
  mode: CodexResearchMode,
  promotedOrganization: boolean,
): boolean {
  if (mode === "enqueue_crawl") {
    return true;
  }

  return mode === "promote_ready" && !promotedOrganization;
}

async function hasPriorSearchOrResearch(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
): Promise<boolean> {
  const priorSearch = await ctx.db
    .query("searchResults")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first();
  if (priorSearch) {
    return true;
  }

  const priorResearch = await ctx.db
    .query("researchRuns")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first();

  return Boolean(priorResearch);
}

/**
 * Lists created organizations that have not already produced search or Codex
 * research artifacts. The caller can enrich code descriptions locally.
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
        q.eq("enrichmentStage", "created"),
      )
      .paginate(paginationOpts);

    const candidates = await Promise.all(
      orgs.page.map(async (org) => {
        if (await hasPriorSearchOrResearch(ctx, org._id)) {
          return null;
        }

        return {
          _id: org._id,
          ein: sanitizeUnicodeString(org.ein),
          name: sanitizeUnicodeString(org.name),
          street: sanitizeUnicodeString(org.street),
          city: sanitizeUnicodeString(org.city),
          state: sanitizeUnicodeString(org.state),
          zip: sanitizeUnicodeString(org.zip),
          nteeCode: sanitizeOptionalUnicodeString(org.nteeCode),
          activityCodes: sanitizeUnicodeStringArray(org.activityCodes),
          assetBucket: sanitizeUnicodeString(org.assetBucket),
          incomeBucket: sanitizeUnicodeString(org.incomeBucket),
          ico: sanitizeOptionalUnicodeString(org.ico),
        };
      }),
    );

    return {
      ...orgs,
      page: candidates.filter((candidate) => candidate !== null),
    };
  },
});

/**
 * Saves a Codex research run and projects successful results into existing
 * pipeline tables according to the selected commit mode.
 */
export const saveRun = mutation({
  args: {
    operatorToken: v.string(),
    orgId: v.id("organizations"),
    model: v.string(),
    status: researchStatusValidator,
    mode: researchModeValidator,
    inputSnapshot: inputSnapshotValidator,
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    codexThreadId: v.optional(v.string()),
    usage: v.optional(usageValidator),
  },
  handler: async (
    ctx,
    {
      operatorToken,
      orgId,
      model,
      status,
      mode,
      inputSnapshot,
      result,
      error,
      codexThreadId,
      usage,
    },
  ) => {
    requireLocalAiToken(operatorToken);

    const org = await ctx.db.get(orgId);
    if (!org || org.enrichmentStage !== "created") {
      throw new Error("Codex research target is no longer eligible");
    }

    const runAt = new Date().toISOString();
    const parsedOutput =
      result === undefined ? undefined : CodexResearchResultSchema.safeParse(result);

    if (status === "succeeded" && (!parsedOutput || !parsedOutput.success)) {
      const details = parsedOutput?.success === false ? parsedOutput.error.message : "";
      throw new Error(`Invalid Codex research result: ${details}`);
    }

    const output = parsedOutput?.success ? parsedOutput.data : undefined;
    const researchRunId = await ctx.db.insert("researchRuns", {
      orgId,
      ein: org.ein,
      agent: "codex",
      model,
      runAt,
      status,
      mode,
      inputSnapshot,
      output,
      error,
      codexThreadId,
      usage,
    });

    if (status !== "succeeded" || !output) {
      await ctx.db.patch(researchRunId, {
        projections: { promotedOrganization: false },
      });
      return {
        success: true,
        researchRunId,
        promotedOrganization: false,
        enrichmentStage: org.enrichmentStage,
        enqueuedCrawlJobIds: [] as Id<"crawlQueue">[],
      };
    }

    const storedSearchResults = buildStoredSearchResults(output);
    const searchResultId =
      storedSearchResults.length > 0
        ? await ctx.db.insert("searchResults", {
            ein: org.ein,
            orgId,
            query: `codex research: ${org.name} ${org.city} ${org.state}`,
            runAt,
            resultsJson: JSON.stringify(storedSearchResults),
          })
        : undefined;

    const aiConfirmationId = await ctx.db.insert("aiConfirmations", {
      ein: org.ein,
      orgId,
      model,
      runAt,
      inputs: {
        searchResultIds: searchResultId ? [searchResultId] : [],
        crawlResultIds: [],
        researchRunId,
      },
      outputs: buildCodexResearchOutputs(output),
    });

    const readyUpdates =
      mode === "promote_ready"
        ? buildCodexResearchReadyUpdates(output)
        : null;
    const promotedOrganization = readyUpdates !== null;
    const enqueuedCrawlJobIds: Id<"crawlQueue">[] = [];

    if (shouldEnqueueCandidate(output, mode, promotedOrganization)) {
      for (const candidate of output.candidateUrls) {
        if (
          (candidate.confidence === "high" ||
            candidate.confidence === "medium") &&
          isEligibleCrawlCandidateUrl(candidate.url)
        ) {
          const jobId = await enqueueCrawlJob(ctx, {
            queueType: "html",
            orgId,
            ein: org.ein,
            url: candidate.url,
          });
          enqueuedCrawlJobIds.push(jobId);
        }
      }
    }

    if (readyUpdates) {
      await patchOrganization(ctx, orgId, {
        ...readyUpdates,
        updatedAt: Date.now(),
      });
    } else {
      await patchOrganization(ctx, orgId, {
        enrichmentStage:
          enqueuedCrawlJobIds.length > 0 ? "searched" : "ai_confirmed",
        updatedAt: Date.now(),
      });
    }

    const nextOrg = await ctx.db.get(orgId);
    await ctx.db.patch(researchRunId, {
      projections: {
        searchResultId,
        aiConfirmationId,
        enqueuedCrawlJobIds,
        promotedOrganization,
      },
    });

    return {
      success: true,
      researchRunId,
      searchResultId,
      aiConfirmationId,
      enqueuedCrawlJobIds,
      promotedOrganization,
      enrichmentStage: nextOrg?.enrichmentStage ?? org.enrichmentStage,
    };
  },
});
