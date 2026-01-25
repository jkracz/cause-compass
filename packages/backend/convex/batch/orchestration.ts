/**
 * Workflow orchestration actions.
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { getBatch, isBatchCompleted, isBatchFailed } from "../lib/openAiBatch";
import { workflow, batchCompletedEvent } from "./workflow";

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * Polls OpenAI for completed batches and sends events to waiting workflows.
 * Called by cron every 15 minutes.
 */
export const pollAndNotifyCompletedBatches = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    checked: number;
    notified: number;
  }> => {
    const isEnabled = process.env.ENABLE_BATCH_CRON === "true";
    if (!isEnabled) {
      console.log("Batch polling disabled (ENABLE_BATCH_CRON !== 'true')");
      return { checked: 0, notified: 0 };
    }

    // Get all jobs in "processing" status that have a workflowId
    const processingJobs = await ctx.runQuery(
      internal.batchJobs.internalGetProcessingJobsWithWorkflow,
      {},
    );

    let notified = 0;

    for (const job of processingJobs) {
      if (!job.batchId || !job.workflowId) continue;

      try {
        // Check status on OpenAI
        const batch = await getBatch(job.batchId);
        console.log(`Batch ${job.batchId} status: ${batch.status}`);

        if (isBatchCompleted(batch.status) && batch.output_file_id) {
          // Update job with output file ID
          await ctx.runMutation(internal.batchJobs.internalSetOutputFileId, {
            jobId: job.jobId,
            outputFileId: batch.output_file_id,
          });

          // Send event to unblock the waiting workflow
          await workflow.sendEvent(ctx, {
            ...batchCompletedEvent,
            workflowId: job.workflowId as WorkflowId,
            value: { outputFileId: batch.output_file_id },
          });

          console.log(
            `Notified workflow ${job.workflowId} that batch ${job.jobId} completed`,
          );
          notified++;
        } else if (isBatchFailed(batch.status)) {
          // Mark job as failed
          const errorMsg =
            batch.errors?.data?.[0]?.message ?? `Batch ${batch.status}`;
          await ctx.runMutation(internal.batchJobs.internalMarkFailed, {
            jobId: job.jobId,
            error: errorMsg,
          });

          // Cancel the workflow
          await workflow.cancel(ctx, job.workflowId as WorkflowId);
          console.log(
            `Canceled workflow ${job.workflowId} due to batch failure: ${errorMsg}`,
          );
        }
      } catch (error) {
        console.error(`Error checking batch ${job.batchId}:`, error);
      }
    }

    console.log(
      `Checked ${processingJobs.length} jobs, notified ${notified} workflows`,
    );
    return { checked: processingJobs.length, notified };
  },
});

/**
 * Start a new batch processing workflow if none are waiting.
 * Called by daily cron as a safety net.
 */
export const startBatchWorkflow = internalAction({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args,
  ): Promise<{
    started: boolean;
    reason: string;
    workflowId?: string;
  }> => {
    const isEnabled = process.env.ENABLE_BATCH_CRON === "true";
    if (!isEnabled) {
      console.log("Batch processing disabled (ENABLE_BATCH_CRON !== 'true')");
      return { started: false, reason: "disabled" };
    }

    // Check if any jobs are already processing (workflow waiting)
    const processingJobs = await ctx.runQuery(
      internal.batchJobs.internalGetProcessingJobs,
      {},
    );

    if (processingJobs.length > 0) {
      console.log("Batch already in progress:", processingJobs[0]!.jobId);
      return { started: false, reason: "batch_in_progress" };
    }

    // Start new workflow
    const workflowId = await workflow.start(
      ctx,
      internal.batch.workflow.batchProcessingWorkflow,
      { limit: args.limit },
    );

    console.log("Started batch workflow:", workflowId);
    return { started: true, reason: "started", workflowId };
  },
});

/**
 * Start the next batch workflow in the chain.
 * Called by a workflow after it completes processing to continue the chain.
 * Does NOT check ENABLE_BATCH_CRON since it's already part of an active chain.
 */
export const chainNextWorkflow = internalAction({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args,
  ): Promise<{
    started: boolean;
    workflowId?: string;
  }> => {
    // Start next workflow in the chain
    const workflowId = await workflow.start(
      ctx,
      internal.batch.workflow.batchProcessingWorkflow,
      { limit: args.limit },
    );

    console.log("Chained next batch workflow:", workflowId);
    return { started: true, workflowId };
  },
});
