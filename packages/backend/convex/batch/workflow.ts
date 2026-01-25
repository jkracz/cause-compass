/**
 * Workflow definition for batch processing.
 *
 * Contains WorkflowManager, event definitions, and workflow definition.
 * These must stay together due to tight coupling.
 */

import { v } from "convex/values";
import { WorkflowManager, defineEvent } from "@convex-dev/workflow";
import { components } from "../_generated/api";
import { internal } from "../_generated/api";
import type { BatchWorkflowResult } from "./types";

/**
 * WorkflowManager instance for durable batch processing workflows.
 */
export const workflow = new WorkflowManager(components.workflow);

/**
 * Event sent by OpenAI webhook when batch completes.
 * Unblocks the waiting workflow to process results.
 */
export const batchCompletedEvent = defineEvent({
  name: "batchCompleted" as const,
  validator: v.object({
    outputFileId: v.string(),
  }),
});

/**
 * Durable workflow for batch processing.
 * Creates a batch, waits for webhook, processes results, then chains to next workflow.
 *
 * Flow:
 * 1. runAction(createBatchJob) → creates batch, uploads to OpenAI
 * 2. awaitEvent("batchCompleted") → PAUSES until webhook fires
 * 3. runAction(processResults) → processes results
 * 4. runAction(chainNextWorkflow) → starts next workflow to continue processing
 *
 * The chain continues until there are no more orgs to process.
 */
export const batchProcessingWorkflow = workflow.define({
  args: { limit: v.optional(v.number()) },
  handler: async (step, args): Promise<BatchWorkflowResult> => {
    // Step 1: Create batch job (fetch orgs, generate JSONL, upload to OpenAI)
    const createResult: {
      success: boolean;
      jobId: string | null;
      batchId: string | null;
      totalCount: number;
      error?: string;
    } = await step.runAction(
      internal.batch.actions.createBatchJob,
      { limit: args.limit },
      { retry: true }
    );

    if (!createResult.success || !createResult.jobId) {
      // No more orgs to process - chain ends here
      return {
        status: "no_work",
        totalCount: createResult.totalCount,
        jobId: null,
      };
    }

    const jobId = createResult.jobId;

    // Store workflowId on the batch job for webhook to find
    await step.runMutation(internal.batchJobs.internalSetWorkflowId, {
      jobId,
      workflowId: step.workflowId,
    });

    // Step 2: Wait for completion event from OpenAI webhook
    // This pauses the workflow until the webhook sends the event
    await step.awaitEvent(batchCompletedEvent);

    // Step 3: Process results
    const processResult: {
      success: boolean;
      processedCount: number;
      errorCount: number;
      error?: string;
    } = await step.runAction(
      internal.batch.actions.processResults,
      { jobId },
      { retry: true }
    );

    // Step 4: Chain to next workflow to continue processing
    // This starts a new workflow which will either process more orgs or end if none left
    await step.runAction(
      internal.batch.orchestration.chainNextWorkflow,
      { limit: args.limit },
      { retry: true }
    );

    return {
      status: "completed",
      jobId,
      processedCount: processResult.processedCount,
      errorCount: processResult.errorCount,
    };
  },
});
