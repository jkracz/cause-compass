/**
 * Public actions for manual testing/debugging.
 *
 * Usage:
 *   npx convex run batch/manual:manualCreateBatch '{"limit": 5}'
 *   npx convex run batch/manual:manualProcessResults '{"jobId": "..."}'
 *   npx convex run batch/manual:manualStartWorkflow '{"limit": 5}'
 *   npx convex run batch/manual:manualPollBatches
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Public action to manually trigger batch job creation.
 */
export const manualCreateBatch = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { limit },
  ): Promise<{
    success: boolean;
    jobId: string | null;
    batchId: string | null;
    totalCount: number;
    error?: string;
  }> => {
    return await ctx.runAction(internal.batch.actions.createBatchJob, {
      limit,
    });
  },
});

/**
 * Public action to manually process batch results.
 */
export const manualProcessResults = action({
  args: {
    jobId: v.string(),
  },
  handler: async (
    ctx,
    { jobId },
  ): Promise<{
    success: boolean;
    processedCount: number;
    errorCount: number;
    error?: string;
  }> => {
    return await ctx.runAction(internal.batch.actions.processResults, {
      jobId,
    });
  },
});

/**
 * Manually start a batch processing workflow.
 */
export const manualStartWorkflow = action({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args,
  ): Promise<{
    started: boolean;
    reason: string;
    workflowId?: string;
  }> => {
    return await ctx.runAction(
      internal.batch.orchestration.startBatchWorkflow,
      args,
    );
  },
});

/**
 * Manually trigger polling for completed batches.
 */
export const manualPollBatches = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    checked: number;
    notified: number;
  }> => {
    return await ctx.runAction(
      internal.batch.orchestration.pollAndNotifyCompletedBatches,
      {},
    );
  },
});
