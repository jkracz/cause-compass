/**
 * Crawl queue internal functions.
 * Used by HTTP action routes to service external Docker workers.
 */

import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import {
  type ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  extractCrawlCandidateUrls,
  getCrawlCandidateKey,
} from "../lib/crawlCandidates";
import {
  sanitizeOptionalUnicodeString,
  sanitizeUnicodeStringArray,
} from "../lib/unicodeSanitization";

const STALE_CLAIM_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const SEARCHED_ORG_PAGE_SIZE = 100;
const SEARCH_RESULT_LOOKBACK_LIMIT = 10;

const queueTypeValidator = v.union(v.literal("html"), v.literal("browser"));

const fallbackReasonValidator = v.union(
  v.literal("LOW_TEXT"),
  v.literal("JS_APP_SHELL"),
  v.literal("HTTP_403_OR_429"),
  v.literal("CLOUDFLARE_CHALLENGE"),
  v.literal("OTHER"),
);

type SearchResultLookupFailure =
  | "missingSearchResult"
  | "invalidSearchResultJson"
  | "missingSearchResultUrl";

type BackfillOrg = {
  orgId: Id<"organizations">;
  ein: string;
  name: string;
};

const backfillOrgValidator = v.object({
  orgId: v.id("organizations"),
  ein: v.string(),
  name: v.string(),
});

const backfillSkippedValidator = v.object({
  existingActiveJob: v.number(),
  missingSearchResult: v.number(),
  invalidSearchResultJson: v.number(),
  missingSearchResultUrl: v.number(),
});

type BackfillSkippedCounts = {
  existingActiveJob: number;
  missingSearchResult: number;
  invalidSearchResultJson: number;
  missingSearchResultUrl: number;
};

function createBackfillSkippedCounts(): BackfillSkippedCounts {
  return {
    existingActiveJob: 0,
    missingSearchResult: 0,
    invalidSearchResultJson: 0,
    missingSearchResultUrl: 0,
  };
}

/** True if the org has any crawl job still pending or processing (HTML or browser). */
async function hasActiveCrawlJobsForOrg(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<boolean> {
  const pending = await ctx.db
    .query("crawlQueue")
    .withIndex("by_orgId_and_status", (q) =>
      q.eq("orgId", orgId).eq("status", "pending"),
    )
    .first();
  if (pending) {
    return true;
  }
  const processing = await ctx.db
    .query("crawlQueue")
    .withIndex("by_orgId_and_status", (q) =>
      q.eq("orgId", orgId).eq("status", "processing"),
    )
    .first();
  return processing !== null;
}

/**
 * When no crawl jobs remain active for this org, advance searched → crawled
 * so AI confirmation can consider it (still filtered by crawl result presence).
 */
async function maybeAdvanceOrgToCrawledWhenQueueSettled(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<void> {
  if (await hasActiveCrawlJobsForOrg(ctx, orgId)) {
    return;
  }
  const org = await ctx.db.get(orgId);
  if (!org || org.enrichmentStage !== "searched") {
    return;
  }
  await ctx.db.patch(orgId, {
    enrichmentStage: "crawled",
    updatedAt: Date.now(),
  });
}

type BackfillResult = {
  enqueued: number;
  scanned: number;
  skipped: BackfillSkippedCounts;
};

async function getLatestUsableSearchResultUrl(
  ctx: MutationCtx,
  ein: string,
  orgName: string,
): Promise<{ urls: string[]; reason?: SearchResultLookupFailure }> {
  const searchResults = await ctx.db
    .query("searchResults")
    .withIndex("by_ein", (q) => q.eq("ein", ein))
    .order("desc")
    .take(SEARCH_RESULT_LOOKBACK_LIMIT);

  if (searchResults.length === 0) {
    return {
      urls: [],
      reason: "missingSearchResult",
    };
  }

  let sawInvalidJson = false;

  for (const searchResult of searchResults) {
    const candidateUrls = extractCrawlCandidateUrls(
      searchResult.resultsJson,
      orgName,
    );
    if (candidateUrls.length > 0) {
      return { urls: candidateUrls };
    }

    try {
      JSON.parse(searchResult.resultsJson);
    } catch {
      sawInvalidJson = true;
    }
  }

  return {
    urls: [],
    reason: sawInvalidJson
      ? "invalidSearchResultJson"
      : "missingSearchResultUrl",
  };
}

async function findExistingJobForCandidate(
  ctx: MutationCtx,
  {
    ein,
    queueType,
    url,
  }: {
    ein: string;
    queueType: "html" | "browser";
    url: string;
  },
) {
  const candidateKey = getCrawlCandidateKey(url);
  const jobs = await ctx.db
    .query("crawlQueue")
    .withIndex("by_ein_and_queueType", (q) =>
      q.eq("ein", ein).eq("queueType", queueType),
    )
    .collect();

  let newestMatchingJob: (typeof jobs)[number] | null = null;

  for (const job of jobs) {
    if (getCrawlCandidateKey(job.url) !== candidateKey) {
      continue;
    }

    if (job.status === "pending" || job.status === "processing") {
      return job;
    }

    if (!newestMatchingJob || job.createdAt > newestMatchingJob.createdAt) {
      newestMatchingJob = job;
    }
  }

  return newestMatchingJob;
}

export async function enqueueCrawlJob(
  ctx: MutationCtx,
  args: {
    queueType: "html" | "browser";
    orgId: Id<"organizations">;
    ein: string;
    url: string;
    maxAttempts?: number;
    fallbackReason?:
      | "LOW_TEXT"
      | "JS_APP_SHELL"
      | "HTTP_403_OR_429"
      | "CLOUDFLARE_CHALLENGE"
      | "OTHER";
  },
): Promise<Id<"crawlQueue">> {
  const existing = await findExistingJobForCandidate(ctx, {
    ein: args.ein,
    queueType: args.queueType,
    url: args.url,
  });

  if (existing) {
    return existing._id;
  }

  const defaultMaxAttempts = args.queueType === "html" ? 4 : 2;

  return await ctx.db.insert("crawlQueue", {
    queueType: args.queueType,
    orgId: args.orgId,
    ein: args.ein,
    url: args.url,
    status: "pending",
    attemptCount: 0,
    maxAttempts: args.maxAttempts ?? defaultMaxAttempts,
    fallbackReason: args.fallbackReason,
    createdAt: Date.now(),
  });
}

/**
 * Enqueue a crawl job. Idempotent on ein + queueType + normalized hostname:
 * if a job already exists for the same candidate domain, returns the existing
 * job ID instead of creating duplicate queue history for the same target.
 */
export const enqueue = internalMutation({
  args: {
    queueType: queueTypeValidator,
    orgId: v.id("organizations"),
    ein: v.string(),
    url: v.string(),
    maxAttempts: v.optional(v.number()),
    fallbackReason: v.optional(fallbackReasonValidator),
  },
  returns: v.id("crawlQueue"),
  handler: async (ctx, args) => {
    return await enqueueCrawlJob(ctx, args);
  },
});

/**
 * Claim the oldest pending job for a given queue type.
 * Atomically transitions pending -> processing.
 * Returns null if no jobs available.
 */
export const claim = internalMutation({
  args: {
    queueType: queueTypeValidator,
    workerId: v.string(),
  },
  returns: v.union(
    v.object({
      jobId: v.id("crawlQueue"),
      orgId: v.id("organizations"),
      ein: v.string(),
      url: v.string(),
      attemptCount: v.number(),
      queueType: queueTypeValidator,
      fallbackReason: v.optional(fallbackReasonValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, { queueType, workerId: _workerId }) => {
    const job = await ctx.db
      .query("crawlQueue")
      .withIndex("by_queueType_and_status", (q) =>
        q.eq("queueType", queueType).eq("status", "pending"),
      )
      .first();

    if (!job) {
      return null;
    }

    await ctx.db.patch(job._id, {
      status: "processing",
      claimedAt: Date.now(),
    });

    return {
      jobId: job._id,
      orgId: job.orgId,
      ein: job.ein,
      url: job.url,
      attemptCount: job.attemptCount,
      queueType: job.queueType,
      fallbackReason: job.fallbackReason,
    };
  },
});

/**
 * Mark a job as completed and link the crawl result.
 * Idempotent: if already completed, returns success.
 */
export const complete = internalMutation({
  args: {
    jobId: v.id("crawlQueue"),
    crawlResultId: v.optional(v.id("crawlResults")),
  },
  returns: v.null(),
  handler: async (ctx, { jobId, crawlResultId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === "completed") {
      return null;
    }

    await ctx.db.patch(jobId, {
      status: "completed",
      ...(crawlResultId ? { crawlResultId } : {}),
      completedAt: Date.now(),
    });

    await maybeAdvanceOrgToCrawledWhenQueueSettled(ctx, job.orgId);

    return null;
  },
});

/**
 * Mark a job as failed. Increments attemptCount.
 * If under maxAttempts, resets to pending for retry.
 * If exhausted, leaves as failed.
 * Idempotent.
 */
export const fail = internalMutation({
  args: {
    jobId: v.id("crawlQueue"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { jobId, error }) => {
    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === "completed" || job.status === "failed") {
      return null;
    }

    const newAttemptCount = job.attemptCount + 1;

    if (newAttemptCount < job.maxAttempts) {
      // Reset to pending for retry
      await ctx.db.patch(jobId, {
        status: "pending",
        attemptCount: newAttemptCount,
        lastError: error,
        claimedAt: undefined,
      });
    } else {
      // Exhausted retries
      await ctx.db.patch(jobId, {
        status: "failed",
        attemptCount: newAttemptCount,
        lastError: error,
        claimedAt: undefined,
      });
      await maybeAdvanceOrgToCrawledWhenQueueSettled(ctx, job.orgId);
    }

    return null;
  },
});

/**
 * Recover stale jobs: processing jobs with claimedAt > 10 min ago.
 * Called by a cron every 3 minutes.
 */
export const recoverStaleJobs = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const staleThreshold = Date.now() - STALE_CLAIM_THRESHOLD_MS;

    const staleJobs = await ctx.db
      .query("crawlQueue")
      .withIndex("by_status_and_claimedAt", (q) =>
        q.eq("status", "processing").lt("claimedAt", staleThreshold),
      )
      .collect();

    let recovered = 0;
    for (const job of staleJobs) {
      const newAttemptCount = job.attemptCount + 1;

      if (newAttemptCount < job.maxAttempts) {
        await ctx.db.patch(job._id, {
          status: "pending",
          attemptCount: newAttemptCount,
          lastError: "Stale claim recovered",
          claimedAt: undefined,
        });
      } else {
        await ctx.db.patch(job._id, {
          status: "failed",
          attemptCount: newAttemptCount,
          lastError: "Stale claim recovered (retries exhausted)",
          claimedAt: undefined,
        });
        await maybeAdvanceOrgToCrawledWhenQueueSettled(ctx, job.orgId);
      }
      recovered++;
    }

    if (recovered > 0) {
      console.log(`Recovered ${recovered} stale crawl queue jobs`);
    }

    return recovered;
  },
});

export const listSearchedOrgsPage = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const searchedOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "searched"),
      )
      .paginate(paginationOpts);

    return {
      ...searchedOrgs,
      page: searchedOrgs.page.map((org) => ({
        orgId: org._id,
        ein: org.ein,
        name: org.name,
      })),
    };
  },
});

export const backfillSearchedOrgsPage = internalMutation({
  args: {
    orgs: v.array(backfillOrgValidator),
    remaining: v.number(),
  },
  returns: v.object({
    enqueued: v.number(),
    scanned: v.number(),
    skipped: backfillSkippedValidator,
  }),
  handler: async (ctx, { orgs, remaining }) => {
    const skipped = createBackfillSkippedCounts();

    if (remaining <= 0) {
      return {
        enqueued: 0,
        scanned: 0,
        skipped,
      };
    }

    let enqueued = 0;
    let scanned = 0;

    for (const org of orgs) {
      if (enqueued >= remaining) {
        break;
      }

      scanned++;

      if (await hasActiveCrawlJobsForOrg(ctx, org.orgId)) {
        skipped.existingActiveJob++;
        continue;
      }

      const searchResult = await getLatestUsableSearchResultUrl(
        ctx,
        org.ein,
        org.name,
      );
      if (searchResult.urls.length === 0) {
        skipped[searchResult.reason ?? "missingSearchResultUrl"]++;
        continue;
      }

      for (const candidateUrl of searchResult.urls) {
        if (enqueued >= remaining) {
          break;
        }

        const existingJob = await findExistingJobForCandidate(ctx, {
          ein: org.ein,
          queueType: "html",
          url: candidateUrl,
        });

        if (existingJob) {
          skipped.existingActiveJob++;
          continue;
        }

        await enqueueCrawlJob(ctx, {
          queueType: "html",
          orgId: org.orgId,
          ein: org.ein,
          url: candidateUrl,
        });
        enqueued++;
      }
    }

    return {
      enqueued,
      scanned,
      skipped,
    };
  },
});

export async function runBackfillSearchedOrgs(
  ctx: Pick<ActionCtx, "runQuery" | "runMutation">,
  limit?: number,
): Promise<number> {
  const targetEnqueueCount = limit ?? 1000;

  if (targetEnqueueCount <= 0) {
    return 0;
  }

  let enqueued = 0;
  let scanned = 0;
  let cursor: string | null = null;
  let isDone = false;
  const skipped = createBackfillSkippedCounts();

  while (enqueued < targetEnqueueCount && !isDone) {
    const searchedOrgs = (await ctx.runQuery(
      internal.crawlQueue.listSearchedOrgsPage,
      {
        paginationOpts: {
          numItems: SEARCHED_ORG_PAGE_SIZE,
          cursor,
        },
      },
    )) as {
      page: BackfillOrg[];
      isDone: boolean;
      continueCursor: string;
    };

    const pageResult = (await ctx.runMutation(
      internal.crawlQueue.backfillSearchedOrgsPage,
      {
        orgs: searchedOrgs.page,
        remaining: targetEnqueueCount - enqueued,
      },
    )) as BackfillResult;

    enqueued += pageResult.enqueued;
    scanned += pageResult.scanned;
    skipped.existingActiveJob += pageResult.skipped.existingActiveJob;
    skipped.missingSearchResult += pageResult.skipped.missingSearchResult;
    skipped.invalidSearchResultJson +=
      pageResult.skipped.invalidSearchResultJson;
    skipped.missingSearchResultUrl += pageResult.skipped.missingSearchResultUrl;

    isDone = searchedOrgs.isDone;
    cursor = searchedOrgs.continueCursor;
  }

  const skippedTotal = Object.values(skipped).reduce(
    (total, count) => total + count,
    0,
  );

  if (scanned > 0 || enqueued > 0) {
    console.log(
      [
        `Backfill scanned ${scanned} searched orgs`,
        `enqueued ${enqueued} crawl jobs`,
        `skipped ${skippedTotal}`,
        `active_job=${skipped.existingActiveJob}`,
        `missing_search_result=${skipped.missingSearchResult}`,
        `invalid_search_result_json=${skipped.invalidSearchResultJson}`,
        `missing_search_result_url=${skipped.missingSearchResultUrl}`,
      ].join(", "),
    );
  }

  return enqueued;
}

/**
 * Backfill: find searched orgs missing active crawl jobs and enqueue them.
 * Called by a cron to catch any missed enqueues.
 */
export const backfillSearchedOrgs = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.number(),
  handler: async (ctx, { limit }) => {
    return await runBackfillSearchedOrgs(ctx, limit);
  },
});

/**
 * Insert a crawl result from a worker.
 * Called by the /worker/complete HTTP route before marking the job complete.
 */
export const insertCrawlResult = internalMutation({
  args: {
    jobId: v.id("crawlQueue"),
    crawlResult: v.object({
      textContent: v.optional(v.string()),
      aboutLinks: v.optional(v.array(v.string())),
      donationLinks: v.optional(v.array(v.string())),
      socialMediaUrls: v.optional(v.array(v.string())),
      logoLinks: v.optional(v.array(v.string())),
      hasNewsletterSignup: v.optional(v.boolean()),
      emailAddresses: v.optional(v.array(v.string())),
    }),
  },
  returns: v.id("crawlResults"),
  handler: async (ctx, { jobId, crawlResult }) => {
    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return await ctx.db.insert("crawlResults", {
      ein: job.ein,
      orgId: job.orgId,
      sourceUrl: job.url,
      runAt: new Date().toISOString(),
      crawlMethod: job.queueType === "html" ? "http" : "browser",
      queueJobId: jobId,
      textContent: sanitizeOptionalUnicodeString(crawlResult.textContent),
      aboutLinks: sanitizeUnicodeStringArray(crawlResult.aboutLinks),
      donationLinks: sanitizeUnicodeStringArray(crawlResult.donationLinks),
      socialMediaUrls: sanitizeUnicodeStringArray(crawlResult.socialMediaUrls),
      logoLinks: sanitizeUnicodeStringArray(crawlResult.logoLinks),
      hasNewsletterSignup: crawlResult.hasNewsletterSignup,
      emailAddresses: sanitizeUnicodeStringArray(crawlResult.emailAddresses),
    });
  },
});

/**
 * Get queue depth stats for monitoring.
 */
export const getQueueStats = internalQuery({
  args: {
    queueType: queueTypeValidator,
  },
  returns: v.object({
    pending: v.number(),
    processing: v.number(),
    completed: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, { queueType }) => {
    const pending = await ctx.db
      .query("crawlQueue")
      .withIndex("by_queueType_and_status", (q) =>
        q.eq("queueType", queueType).eq("status", "pending"),
      )
      .collect();

    const processing = await ctx.db
      .query("crawlQueue")
      .withIndex("by_queueType_and_status", (q) =>
        q.eq("queueType", queueType).eq("status", "processing"),
      )
      .collect();

    const completed = await ctx.db
      .query("crawlQueue")
      .withIndex("by_queueType_and_status", (q) =>
        q.eq("queueType", queueType).eq("status", "completed"),
      )
      .collect();

    const failed = await ctx.db
      .query("crawlQueue")
      .withIndex("by_queueType_and_status", (q) =>
        q.eq("queueType", queueType).eq("status", "failed"),
      )
      .collect();

    return {
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
    };
  },
});
