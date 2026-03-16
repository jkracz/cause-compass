import { query } from "./_generated/server";
import { v } from "convex/values";

const ENRICHMENT_STAGES = [
  "created",
  "searched",
  "crawled",
  "ai_confirmed",
  "ready",
] as const;

type EnrichmentStage = (typeof ENRICHMENT_STAGES)[number];

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

export const getSummary = query({
  args: {
    staleHours: v.optional(v.number()),
  },
  returns: summaryValidator,
  handler: async (ctx, { staleHours = 24 }) => {
    const normalizedStaleHours = Math.max(1, Math.floor(staleHours));
    const cutoffTimestamp =
      Date.now() - normalizedStaleHours * 60 * 60 * 1000;

    const stageEntries = await Promise.all(
      ENRICHMENT_STAGES.map(async (stage) => {
        const orgs = await ctx.db
          .query("organizations")
          .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", stage))
          .collect();

        let stale = 0;
        let missingUpdatedAt = 0;
        for (const org of orgs) {
          if (org.updatedAt === undefined) {
            missingUpdatedAt++;
          } else if (org.updatedAt < cutoffTimestamp) {
            stale++;
          }
        }

        const total = orgs.length;
        const staleOrMissing = stale + missingUpdatedAt;
        const fresh = Math.max(0, total - staleOrMissing);
        const stalePercent =
          total === 0
            ? 0
            : Math.round((staleOrMissing / total) * 1000) / 10;

        return [
          stage,
          {
            total,
            stale,
            missingUpdatedAt,
            staleOrMissing,
            fresh,
            stalePercent,
          },
        ] as const;
      }),
    );

    const stageMap = new Map<EnrichmentStage, (typeof stageEntries)[number][1]>(
      stageEntries,
    );

    const byStage = {
      created: stageMap.get("created")!,
      searched: stageMap.get("searched")!,
      crawled: stageMap.get("crawled")!,
      ai_confirmed: stageMap.get("ai_confirmed")!,
      ready: stageMap.get("ready")!,
    };

    const organizationTotals = stageEntries.reduce(
      (acc, [, stage]) => {
        acc.total += stage.total;
        acc.stale += stage.stale;
        acc.missingUpdatedAt += stage.missingUpdatedAt;
        acc.staleOrMissing += stage.staleOrMissing;
        acc.fresh += stage.fresh;
        return acc;
      },
      {
        total: 0,
        stale: 0,
        missingUpdatedAt: 0,
        staleOrMissing: 0,
        fresh: 0,
      },
    );

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
