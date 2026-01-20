/**
 * CRUD operations for batch jobs.
 * Handles tracking OpenAI batch processing jobs for AI enrichment.
 */

import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// Validator for batch job status
const batchJobStatusValidator = v.union(
  v.literal("pending"),
  v.literal("generating"),
  v.literal("uploading"),
  v.literal("processing"),
  v.literal("downloading"),
  v.literal("completed"),
  v.literal("failed"),
);

// Batch job document validator (for return types)
const batchJobValidator = v.object({
  _id: v.id("batchJobs"),
  _creationTime: v.number(),
  jobId: v.string(),
  status: batchJobStatusValidator,
  createdAt: v.string(),
  updatedAt: v.string(),
  batchSize: v.number(),
  totalCount: v.optional(v.number()),
  fileId: v.optional(v.string()),
  batchId: v.optional(v.string()),
  outputFileId: v.optional(v.string()),
  inputFile: v.optional(v.string()),
  outputFile: v.optional(v.string()),
  processedCount: v.optional(v.number()),
  error: v.optional(v.string()),
  artifactId: v.optional(v.string()),
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
 * Get a batch job by its Convex document ID.
 */
export const getById = query({
  args: { id: v.id("batchJobs") },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
 * Get active batch jobs (jobs that are currently in progress).
 */
export const listActive = query({
  args: {},
  returns: v.array(batchJobValidator),
  handler: async (ctx) => {
    const activeStatuses = [
      "pending",
      "generating",
      "uploading",
      "processing",
      "downloading",
    ] as const;

    // Collect jobs from all active status indexes
    const results: Doc<"batchJobs">[] = [];

    for (const status of activeStatuses) {
      const jobs = await ctx.db
        .query("batchJobs")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      results.push(...jobs);
    }

    // Sort by createdAt descending
    return results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
});

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

/**
 * Create a new batch job.
 */
export const create = mutation({
  args: {
    jobId: v.string(),
    batchSize: v.number(),
    totalCount: v.optional(v.number()),
  },
  returns: v.id("batchJobs"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert("batchJobs", {
      jobId: args.jobId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      batchSize: args.batchSize,
      totalCount: args.totalCount,
    });
  },
});

/**
 * Update a batch job's status.
 */
export const updateStatus = mutation({
  args: {
    jobId: v.string(),
    status: batchJobStatusValidator,
    error: v.optional(v.string()),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates: {
      status: typeof args.status;
      updatedAt: string;
      error?: string;
    } = {
      status: args.status,
      updatedAt: new Date().toISOString(),
    };

    if (args.error !== undefined) {
      updates.error = args.error;
    }

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

/**
 * Update a batch job with OpenAI file ID (after file upload).
 */
export const updateFileId = mutation({
  args: {
    jobId: v.string(),
    fileId: v.string(),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates = {
      fileId: args.fileId,
      updatedAt: new Date().toISOString(),
    };

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

/**
 * Update a batch job with OpenAI batch ID (after batch creation).
 */
export const updateBatchId = mutation({
  args: {
    jobId: v.string(),
    batchId: v.string(),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates = {
      batchId: args.batchId,
      updatedAt: new Date().toISOString(),
    };

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

/**
 * Update a batch job with OpenAI output file ID (after batch completion).
 */
export const updateOutputFileId = mutation({
  args: {
    jobId: v.string(),
    outputFileId: v.string(),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates = {
      outputFileId: args.outputFileId,
      updatedAt: new Date().toISOString(),
    };

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

/**
 * Update processing progress for a batch job.
 */
export const updateProgress = mutation({
  args: {
    jobId: v.string(),
    processedCount: v.number(),
    totalCount: v.optional(v.number()),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates: {
      processedCount: number;
      updatedAt: string;
      totalCount?: number;
    } = {
      processedCount: args.processedCount,
      updatedAt: new Date().toISOString(),
    };

    if (args.totalCount !== undefined) {
      updates.totalCount = args.totalCount;
    }

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

/**
 * Mark a batch job as completed.
 */
export const markCompleted = mutation({
  args: {
    jobId: v.string(),
    processedCount: v.optional(v.number()),
    outputFile: v.optional(v.string()),
    artifactId: v.optional(v.string()),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates: {
      status: "completed";
      updatedAt: string;
      processedCount?: number;
      outputFile?: string;
      artifactId?: string;
    } = {
      status: "completed",
      updatedAt: new Date().toISOString(),
    };

    if (args.processedCount !== undefined) {
      updates.processedCount = args.processedCount;
    }
    if (args.outputFile !== undefined) {
      updates.outputFile = args.outputFile;
    }
    if (args.artifactId !== undefined) {
      updates.artifactId = args.artifactId;
    }

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

/**
 * Mark a batch job as failed.
 */
export const markFailed = mutation({
  args: {
    jobId: v.string(),
    error: v.string(),
  },
  returns: v.union(batchJobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      return null;
    }

    const updates = {
      status: "failed" as const,
      error: args.error,
      updatedAt: new Date().toISOString(),
    };

    await ctx.db.patch(job._id, updates);

    return {
      ...job,
      ...updates,
    };
  },
});

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

// ============================================================================
// INTERNAL QUERIES (for use by other Convex functions)
// ============================================================================

/**
 * Internal query to get a batch job by jobId.
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
 * Internal query to get jobs that are processing (for status checks).
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
 * Internal query to list batch jobs by status.
 */
export const internalListByStatus = internalQuery({
  args: {
    status: batchJobStatusValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("batchJobs")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(limit);
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for use by actions and other internal functions)
// ============================================================================

/**
 * Internal mutation to create a batch job.
 */
export const internalCreate = internalMutation({
  args: {
    jobId: v.string(),
    batchSize: v.number(),
    totalCount: v.optional(v.number()),
    inputFile: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert("batchJobs", {
      jobId: args.jobId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      batchSize: args.batchSize,
      totalCount: args.totalCount,
      inputFile: args.inputFile,
    });
  },
});

/**
 * Internal mutation to update batch job status.
 */
export const internalUpdateStatus = internalMutation({
  args: {
    jobId: v.string(),
    status: batchJobStatusValidator,
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Batch job not found: ${args.jobId}`);
    }

    const updates: {
      status: typeof args.status;
      updatedAt: string;
      error?: string;
    } = {
      status: args.status,
      updatedAt: new Date().toISOString(),
    };

    if (args.error !== undefined) {
      updates.error = args.error;
    }

    await ctx.db.patch(job._id, updates);
  },
});

/**
 * Internal mutation to update OpenAI references.
 */
export const internalUpdateOpenAIRefs = internalMutation({
  args: {
    jobId: v.string(),
    fileId: v.optional(v.string()),
    batchId: v.optional(v.string()),
    outputFileId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Batch job not found: ${args.jobId}`);
    }

    const updates: {
      updatedAt: string;
      fileId?: string;
      batchId?: string;
      outputFileId?: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (args.fileId !== undefined) {
      updates.fileId = args.fileId;
    }
    if (args.batchId !== undefined) {
      updates.batchId = args.batchId;
    }
    if (args.outputFileId !== undefined) {
      updates.outputFileId = args.outputFileId;
    }

    await ctx.db.patch(job._id, updates);
  },
});

/**
 * Internal mutation to update processing progress.
 */
export const internalUpdateProgress = internalMutation({
  args: {
    jobId: v.string(),
    processedCount: v.number(),
    totalCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Batch job not found: ${args.jobId}`);
    }

    const updates: {
      processedCount: number;
      updatedAt: string;
      totalCount?: number;
    } = {
      processedCount: args.processedCount,
      updatedAt: new Date().toISOString(),
    };

    if (args.totalCount !== undefined) {
      updates.totalCount = args.totalCount;
    }

    await ctx.db.patch(job._id, updates);
  },
});

/**
 * Internal mutation to mark a batch job as completed.
 */
export const internalMarkCompleted = internalMutation({
  args: {
    jobId: v.string(),
    processedCount: v.optional(v.number()),
    outputFile: v.optional(v.string()),
    artifactId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("batchJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!job) {
      throw new Error(`Batch job not found: ${args.jobId}`);
    }

    const updates: {
      status: "completed";
      updatedAt: string;
      processedCount?: number;
      outputFile?: string;
      artifactId?: string;
    } = {
      status: "completed",
      updatedAt: new Date().toISOString(),
    };

    if (args.processedCount !== undefined) {
      updates.processedCount = args.processedCount;
    }
    if (args.outputFile !== undefined) {
      updates.outputFile = args.outputFile;
    }
    if (args.artifactId !== undefined) {
      updates.artifactId = args.artifactId;
    }

    await ctx.db.patch(job._id, updates);
  },
});

/**
 * Internal mutation to mark a batch job as failed.
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
      error: args.error,
      updatedAt: new Date().toISOString(),
    });
  },
});
