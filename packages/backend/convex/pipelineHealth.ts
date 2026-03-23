import { query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { orgStageAggregate } from "./aggregates";
import { v } from "convex/values";

const ENRICHMENT_STAGES = [
  "created",
  "searched",
  "crawled",
  "ai_confirmed",
  "ready",
] as const;

type EnrichmentStage = (typeof ENRICHMENT_STAGES)[number];

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const stageHealthValidator = v.object({
  total: v.number(),
  stale: v.number(),
  missingUpdatedAt: v.number(),
  staleOrMissing: v.number(),
  fresh: v.number(),
  stalePercent: v.number(),
});

const batchHealthValidator = v.object({
  total: v.number(),
  processing: v.number(),
  completed: v.number(),
  failed: v.number(),
  lastSuccessfulBatchAt: v.union(v.string(), v.null()),
  lastFailedBatchAt: v.union(v.string(), v.null()),
});

const processingJobValidator = v.object({
  jobId: v.string(),
  status: v.literal("processing"),
  createdAt: v.string(),
  batchId: v.optional(v.string()),
  workflowId: v.optional(v.string()),
});

const summaryValidator = v.object({
  generatedAtIso: v.string(),
  staleHours: v.number(),
  cutoffTimestamp: v.number(),
  organizationTotals: v.object({
    total: v.number(),
    stale: v.number(),
    missingUpdatedAt: v.number(),
    staleOrMissing: v.number(),
    fresh: v.number(),
  }),
  byStage: v.object({
    created: stageHealthValidator,
    searched: stageHealthValidator,
    crawled: stageHealthValidator,
    ai_confirmed: stageHealthValidator,
    ready: stageHealthValidator,
  }),
  batchJobs: batchHealthValidator,
  activeProcessingJobs: v.array(processingJobValidator),
  notes: v.array(v.string()),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function latestBatchTimestamp(
  jobs: Array<{ createdAt: string; completedAt?: string }>,
): string | null {
  let latest: string | null = null;
  for (const job of jobs) {
    const candidate = job.completedAt ?? job.createdAt;
    if (!latest || candidate > latest) {
      latest = candidate;
    }
  }
  return latest;
}

// ---------------------------------------------------------------------------
// Public query: live pipeline health using aggregate counts (O(log n) each)
// ---------------------------------------------------------------------------

export const getSummary = query({
  args: {
    staleHours: v.optional(v.number()),
  },
  returns: summaryValidator,
  handler: async (ctx, { staleHours = 24 }) => {
    const normalizedStaleHours = Math.max(1, Math.floor(staleHours));
    const cutoffTimestamp =
      Date.now() - normalizedStaleHours * 60 * 60 * 1000;

    // Batch all 15 counts in a single call:
    //   [0..4]   total per stage
    //   [5..9]   missing updatedAt per stage (sortKey <= 0, the sentinel)
    //   [10..14] stale-or-missing per stage  (sortKey < cutoff)
    const counts = await orgStageAggregate.countBatch(ctx, [
      ...ENRICHMENT_STAGES.map((stage) => ({ namespace: stage as string })),
      ...ENRICHMENT_STAGES.map((stage) => ({
        namespace: stage as string,
        bounds: { upper: { key: 0, inclusive: true } } as const,
      })),
      ...ENRICHMENT_STAGES.map((stage) => ({
        namespace: stage as string,
        bounds: { upper: { key: cutoffTimestamp, inclusive: false } } as const,
      })),
    ]);

    const byStage = {} as Record<
      EnrichmentStage,
      {
        total: number;
        stale: number;
        missingUpdatedAt: number;
        staleOrMissing: number;
        fresh: number;
        stalePercent: number;
      }
    >;

    const organizationTotals = {
      total: 0,
      stale: 0,
      missingUpdatedAt: 0,
      staleOrMissing: 0,
      fresh: 0,
    };

    for (let i = 0; i < ENRICHMENT_STAGES.length; i++) {
      const stage = ENRICHMENT_STAGES[i]!;
      const total = counts[i]!;
      const missingUpdatedAt = counts[i + 5]!;
      const staleOrMissing = counts[i + 10]!;
      const stale = staleOrMissing - missingUpdatedAt;
      const fresh = Math.max(0, total - staleOrMissing);
      const stalePercent =
        total === 0
          ? 0
          : Math.round((staleOrMissing / total) * 1000) / 10;

      byStage[stage] = {
        total,
        stale,
        missingUpdatedAt,
        staleOrMissing,
        fresh,
        stalePercent,
      };

      organizationTotals.total += total;
      organizationTotals.stale += stale;
      organizationTotals.missingUpdatedAt += missingUpdatedAt;
      organizationTotals.staleOrMissing += staleOrMissing;
      organizationTotals.fresh += fresh;
    }

    // Batch jobs — table is small enough for direct queries
    const [processingJobs, completedJobs, failedJobs] = await Promise.all([
      ctx.db
        .query("batchJobs")
        .withIndex("by_status", (q) => q.eq("status", "processing"))
        .collect(),
      ctx.db
        .query("batchJobs")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .collect(),
      ctx.db
        .query("batchJobs")
        .withIndex("by_status", (q) => q.eq("status", "failed"))
        .collect(),
    ]);

    const notes: string[] = [];
    if (byStage.created.total > 0) {
      notes.push(
        `Backlog in 'created': ${byStage.created.total} orgs still need search/crawl.`,
      );
    }
    if (byStage.searched.total > 0) {
      notes.push(
        `Backlog in 'searched': ${byStage.searched.total} orgs likely waiting on crawler.`,
      );
    }
    if (byStage.ai_confirmed.total > 0) {
      notes.push(
        `Backlog in 'ai_confirmed': ${byStage.ai_confirmed.total} orgs need finalization to 'ready'.`,
      );
    }
    if (processingJobs.length === 0) {
      notes.push("No active batch jobs in 'processing'.");
    }

    return {
      generatedAtIso: new Date().toISOString(),
      staleHours: normalizedStaleHours,
      cutoffTimestamp,
      organizationTotals,
      byStage,
      batchJobs: {
        total: processingJobs.length + completedJobs.length + failedJobs.length,
        processing: processingJobs.length,
        completed: completedJobs.length,
        failed: failedJobs.length,
        lastSuccessfulBatchAt: latestBatchTimestamp(completedJobs),
        lastFailedBatchAt: latestBatchTimestamp(failedJobs),
      },
      activeProcessingJobs: processingJobs.map((job) => ({
        jobId: job.jobId,
        status: "processing" as const,
        createdAt: job.createdAt,
        batchId: job.batchId,
        workflowId: job.workflowId,
      })),
      notes,
    };
  },
});

// ---------------------------------------------------------------------------
// Backfill: populate aggregate from existing organizations.
// Run after initial deploy or after any bulk import (npx convex import).
// Self-schedules to process all organizations in pages of 100.
//
// Trigger from the Convex dashboard or CLI:
//   npx convex run pipelineHealth:backfillAggregate '{"cursor": null}'
// ---------------------------------------------------------------------------

export const backfillAggregate = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const result = await ctx.db
      .query("organizations")
      .paginate({ numItems: 100, cursor: cursor ?? null });

    for (const doc of result.page) {
      await orgStageAggregate.insertIfDoesNotExist(ctx, doc);
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.pipelineHealth.backfillAggregate,
        { cursor: result.continueCursor },
      );
    }

    return null;
  },
});
