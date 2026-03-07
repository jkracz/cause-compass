/**
 * Crawl queue internal functions.
 * Used by HTTP action routes to service external Docker workers.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const STALE_CLAIM_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const queueTypeValidator = v.union(v.literal("html"), v.literal("browser"));

const fallbackReasonValidator = v.union(
  v.literal("LOW_TEXT"),
  v.literal("JS_APP_SHELL"),
  v.literal("HTTP_403_OR_429"),
  v.literal("CLOUDFLARE_CHALLENGE"),
  v.literal("OTHER"),
);

/**
 * Enqueue a crawl job. Idempotent on ein + queueType:
 * if an active (pending/processing) job exists, returns the existing job ID.
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
    // Check for existing active job
    const existing = await ctx.db
      .query("crawlQueue")
      .withIndex("by_ein_and_queueType", (q) =>
        q.eq("ein", args.ein).eq("queueType", args.queueType),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing"),
        ),
      )
      .first();

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
    crawlResultId: v.id("crawlResults"),
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
      crawlResultId,
      completedAt: Date.now(),
    });

    // Update org enrichment stage to crawled
    await ctx.db.patch(job.orgId, {
      enrichmentStage: "crawled",
      updatedAt: Date.now(),
    });

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
      }
      recovered++;
    }

    if (recovered > 0) {
      console.log(`Recovered ${recovered} stale crawl queue jobs`);
    }

    return recovered;
  },
});

/**
 * Backfill: find searched orgs missing active crawl jobs and enqueue them.
 * Called by a cron to catch any missed enqueues.
 */
export const backfillSearchedOrgs = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.number(),
  handler: async (ctx, { limit }) => {
    const batchLimit = limit ?? 100;

    const searchedOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) =>
        q.eq("enrichmentStage", "searched"),
      )
      .take(batchLimit);

    let enqueued = 0;

    for (const org of searchedOrgs) {
      // Check if there's already an active crawl job
      const existingJob = await ctx.db
        .query("crawlQueue")
        .withIndex("by_ein_and_queueType", (q) =>
          q.eq("ein", org.ein).eq("queueType", "html"),
        )
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "processing"),
          ),
        )
        .first();

      if (existingJob) {
        continue;
      }

      // Find search result to extract URL
      const searchResult = await ctx.db
        .query("searchResults")
        .withIndex("by_ein", (q) => q.eq("ein", org.ein))
        .first();

      if (!searchResult) {
        continue;
      }

      let url: string | null = null;
      try {
        const results: unknown = JSON.parse(searchResult.resultsJson);
        if (
          Array.isArray(results) &&
          results.length > 0 &&
          typeof (results[0] as Record<string, unknown>).link === "string"
        ) {
          url = (results[0] as Record<string, unknown>).link as string;
        }
      } catch {
        continue;
      }

      if (!url) {
        continue;
      }

      await ctx.db.insert("crawlQueue", {
        queueType: "html",
        orgId: org._id,
        ein: org.ein,
        url,
        status: "pending",
        attemptCount: 0,
        maxAttempts: 4,
        createdAt: Date.now(),
      });
      enqueued++;
    }

    if (enqueued > 0) {
      console.log(`Backfill enqueued ${enqueued} crawl jobs`);
    }

    return enqueued;
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
      ...crawlResult,
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
