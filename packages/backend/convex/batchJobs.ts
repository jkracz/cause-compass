/**
 * Batch jobs - audit log for OpenAI batch processing.
 * Orchestration is handled by the workflow component; this table tracks results.
 */

import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";

// Simplified status validator (workflow handles orchestration)
const batchJobStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed")
);

// Batch job document validator (for return types)
const batchJobValidator = v.object({
  _id: v.id("batchJobs"),
  _creationTime: v.number(),
  jobId: v.string(),
  status: batchJobStatusValidator,
  createdAt: v.string(),
  completedAt: v.optional(v.string()),
  batchSize: v.number(),
  batchId: v.optional(v.string()),
  outputFileId: v.optional(v.string()),
  processedCount: v.optional(v.number()),
  errorCount: v.optional(v.number()),
  error: v.optional(v.string()),
  workflowId: v.optional(v.string()),
});

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get a batch job by its jobId.
 */
export const getByJobId = query({
  args: { jobId: v.string() },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

/**
 * List batch jobs by status.
 */
export const listByStatus = query({
  args: {
    status: batchJobStatusValidator,
    limit: v.optional(v.number()),
  },
  returns: v.array(batchJobValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(limit);
  },
});

/**
 * List all batch jobs, ordered by creation date (newest first).
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(batchJobValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get active batch jobs (jobs currently processing).
 */
export const listActive = query({
  args: {},
  returns: v.array(batchJobValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .collect();
  },
});

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

/**
 * Get a batch job by jobId.
 */
export const internalGetByJobId = internalQuery({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

/**
 * Get all processing jobs.
 */
export const internalGetProcessingJobs = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .collect();
  },
});

/**
 * Get processing jobs that have an associated workflow.
 * Used by polling cron to find batches to check on OpenAI.
 */
export const internalGetProcessingJobsWithWorkflow = internalQuery({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("batchJobs")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .collect();

    return jobs.filter((job) => job.workflowId);
  },
});

/**
 * Get a batch job by OpenAI's batchId.
 * Used by webhook handler to find the job when OpenAI sends completion event.
 */
export const internalGetByBatchId = internalQuery({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .first();
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Create a new batch job in processing status.
 */
export const internalCreate = internalMutation({
  args: {
    jobId: v.string(),
    batchSize: v.number(),
    batchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("batchJobs", {
      jobId: args.jobId,
      status: "processing",
      createdAt: new Date().toISOString(),
      batchSize: args.batchSize,
      batchId: args.batchId,
    });
  },
});

/**
 * Set the workflow ID on a batch job.
 */
export const internalSetWorkflowId = internalMutation({
  args: {
    jobId: v.string(),
    workflowId: v.string(),
  },
  handler: async (ctx, { jobId, workflowId }) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, { workflowId });
    }
  },
});

/**
 * Set the output file ID (called when OpenAI batch completes).
 */
export const internalSetOutputFileId = internalMutation({
  args: {
    jobId: v.string(),
    outputFileId: v.string(),
  },
  handler: async (ctx, { jobId, outputFileId }) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, { outputFileId });
    }
  },
});

/**
 * Mark a batch job as completed.
 */
export const internalMarkCompleted = internalMutation({
  args: {
    jobId: v.string(),
    processedCount: v.number(),
    errorCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Batch job not found: ${args.jobId}`);
    }

    await ctx.db.patch(job._id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      processedCount: args.processedCount,
      errorCount: args.errorCount,
    });
  },
});

/**
 * Mark a batch job as failed.
 */
export const internalMarkFailed = internalMutation({
  args: {
    jobId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Batch job not found: ${args.jobId}`);
    }

    await ctx.db.patch(job._id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      error: args.error,
    });
  },
});

// ============================================================================
// PUBLIC MUTATIONS (for admin/debugging)
// ============================================================================

/**
 * Delete a batch job by jobId.
 */
export const deleteByJobId = mutation({
  args: { jobId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (job) {
      await ctx.db.delete(job._id);
      return true;
    }

    return false;
  },
});
