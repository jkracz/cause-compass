/**
 * OpenAI Batch API integration for Convex actions.
 *
 * This module provides actions for creating, monitoring, and processing
 * OpenAI batch jobs for AI enrichment of organization data.
 *
 * Usage:
 *   Manual test: npx convex run openAiBatch:createBatchJob '{"limit": 5}'
 *   Check status: npx convex run openAiBatch:checkBatchStatus '{"jobId": "..."}'
 *   Process results: npx convex run openAiBatch:processResults '{"jobId": "..."}'
 */

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { WorkflowManager, defineEvent, type WorkflowId } from "@convex-dev/workflow";
import {
  uploadBatchFile,
  createBatch,
  getBatch,
  downloadFileContent,
  parseJSONL,
  toJSONL,
  createConfirmationRequestLine,
  isBatchCompleted,
  isBatchFailed,
} from "./lib/openAiBatch";
import {
  processCrawlDataForConfirmedWebsite,
  type CrawlItemData,
} from "./lib/batchResponseProcessing";

// ============================================================================
// Workflow Setup
// ============================================================================

/**
 * WorkflowManager instance for durable batch processing workflows.
 */
const workflow = new WorkflowManager(components.workflow);

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

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

import type { Id } from "./_generated/dataModel";

// ============================================================================
// Types
// ============================================================================

/**
 * Organization data ready for AI confirmation
 */
interface OrgForAiConfirmation {
  _id: Id<"organizations">;
  ein: string;
  name: string;
  street: string;
  city: string;
  state: string;
  nteeCode: string | undefined;
  crawlData: Array<{
    url: string;
    title: string;
    textContent: string;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MODEL = "gpt-4o-mini";

// JSON Schema for WebsiteConfirmation response format
// This matches the WebsiteConfirmationSchema from @cause/types
const WEBSITE_CONFIRMATION_SCHEMA = {
  type: "object",
  properties: {
    hasCorrectWebsite: {
      type: "boolean",
      description: "Whether the model determined the provided URL is the correct website",
    },
    correctWebsiteUrl: {
      type: ["string", "null"],
      description: "The correct website URL if found, otherwise null",
    },
    reasoning: {
      type: "string",
      description: "Explanation of how the correct website was identified or why none matched",
    },
    organizationOneSentenceSummary: {
      type: ["string", "null"],
      description: "A brief summary of the organization",
    },
    whySupportOrganization: {
      type: ["string", "null"],
      description: "Why one should consider supporting the organization",
    },
    organizationMission: {
      type: ["string", "null"],
      description: "The mission statement of the organization",
    },
    organizationTagline: {
      type: ["string", "null"],
      description: "A tagline or slogan of the organization",
    },
    organizationUniqueTrait: {
      type: ["string", "null"],
      description: "What makes the organization unique",
    },
    organizationTargetAudience: {
      type: ["string", "null"],
      description: "The primary audience the organization serves",
    },
    organizationGeographicFocus: {
      type: ["string", "null"],
      enum: ["Global", "National", "Regional", "Local", null],
      description: "Geographic focus: Global/Regional/National/Local",
    },
    organizationActivities: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
      description: "Key organizational activities (name and description)",
    },
    organizationKeywords: {
      type: ["array", "null"],
      items: { type: "string" },
      description: "Key words or labels that give quick insight into what the organization does",
    },
  },
  required: [
    "hasCorrectWebsite",
    "correctWebsiteUrl",
    "reasoning",
    "organizationOneSentenceSummary",
    "whySupportOrganization",
    "organizationMission",
    "organizationTagline",
    "organizationUniqueTrait",
    "organizationTargetAudience",
    "organizationGeographicFocus",
    "organizationActivities",
    "organizationKeywords",
  ],
  additionalProperties: false,
};

// ============================================================================
// Internal Queries
// ============================================================================

/**
 * Get organizations ready for AI confirmation.
 * Returns orgs that have been crawled but not yet processed by AI.
 */
export const internalGetOrgsForAiConfirmation = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }): Promise<OrgForAiConfirmation[]> => {
    // Get organizations in "crawled" stage (have search + crawl results but no AI confirmation)
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "crawled"))
      .take(limit);

    // For each org, fetch the associated crawl results
    const orgsWithCrawlData: OrgForAiConfirmation[] = await Promise.all(
      orgs.map(async (org): Promise<OrgForAiConfirmation> => {
        const crawlResults = await ctx.db
          .query("crawlResults")
          .withIndex("by_ein", (q) => q.eq("ein", org.ein))
          .collect();

        return {
          _id: org._id,
          ein: org.ein,
          name: org.name,
          street: org.street,
          city: org.city,
          state: org.state,
          nteeCode: org.nteeCode,
          crawlData: crawlResults.map((cr) => ({
            url: cr.sourceUrl,
            title: cr.sourceUrl, // Use URL as title if not available
            textContent: cr.textContent ?? "",
          })),
        };
      })
    );

    // Filter out orgs with no crawl data
    return orgsWithCrawlData.filter((org) => org.crawlData.length > 0);
  },
});

/**
 * Get organization by EIN for result processing.
 */
export const internalGetOrgByEin = internalQuery({
  args: { ein: v.string() },
  handler: async (ctx, { ein }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_ein", (q) => q.eq("ein", ein))
      .first();
  },
});

/**
 * Get crawl results by EIN for result processing.
 * Returns crawl data needed for extracting social media, logos, donation links.
 */
export const internalGetCrawlResultsByEin = internalQuery({
  args: { ein: v.string() },
  handler: async (ctx, { ein }): Promise<CrawlItemData[]> => {
    const crawlResults = await ctx.db
      .query("crawlResults")
      .withIndex("by_ein", (q) => q.eq("ein", ein))
      .collect();

    return crawlResults.map((cr) => ({
      sourceUrl: cr.sourceUrl,
      textContent: cr.textContent,
      aboutLinks: cr.aboutLinks,
      donationLinks: cr.donationLinks,
      socialMediaUrls: cr.socialMediaUrls,
      logoLinks: cr.logoLinks,
      emailAddresses: cr.emailAddresses,
    }));
  },
});

// ============================================================================
// Internal Mutations
// ============================================================================

/**
 * Update organization with AI confirmation results.
 */
export const internalUpdateOrgWithAiResults = internalMutation({
  args: {
    orgId: v.id("organizations"),
    updates: v.object({
      websiteUrl: v.optional(v.string()),
      mission: v.optional(v.string()),
      tagline: v.optional(v.string()),
      oneSentenceSummary: v.optional(v.string()),
      whySupport: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      geographicFocus: v.optional(
        v.union(
          v.literal("Global"),
          v.literal("National"),
          v.literal("Regional"),
          v.literal("Local")
        )
      ),
      activities: v.optional(
        v.array(
          v.object({
            name: v.string(),
            description: v.string(),
          })
        )
      ),
      keywords: v.optional(v.array(v.string())),
      // Crawl-extracted fields
      socialMediaUrls: v.optional(
        v.object({
          linkedin: v.optional(v.string()),
          youtube: v.optional(v.string()),
          x: v.optional(v.string()),
          instagram: v.optional(v.string()),
          threads: v.optional(v.string()),
          facebook: v.optional(v.string()),
          twitter: v.optional(v.string()),
        })
      ),
      donationUrl: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      emailAddresses: v.optional(v.array(v.string())),
      enrichmentStage: v.optional(
        v.union(
          v.literal("created"),
          v.literal("searched"),
          v.literal("crawled"),
          v.literal("ai_confirmed"),
          v.literal("ready")
        )
      ),
    }),
  },
  handler: async (ctx, { orgId, updates }) => {
    await ctx.db.patch(orgId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Insert AI confirmation record.
 */
export const internalInsertAiConfirmation = internalMutation({
  args: {
    ein: v.string(),
    orgId: v.id("organizations"),
    model: v.string(),
    outputs: v.object({
      hasCorrectWebsite: v.boolean(),
      correctWebsiteUrl: v.optional(v.string()),
      mission: v.optional(v.string()),
      tagline: v.optional(v.string()),
      oneSentenceSummary: v.optional(v.string()),
      whySupport: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      geographicFocus: v.optional(v.string()),
      activityTags: v.optional(
        v.array(
          v.object({
            name: v.string(),
            description: v.string(),
          })
        )
      ),
      reasoning: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { ein, orgId, model, outputs }) => {
    await ctx.db.insert("aiConfirmations", {
      ein,
      orgId,
      model,
      runAt: new Date().toISOString(),
      inputs: {
        searchResultIds: [],
        crawlResultIds: [],
      },
      outputs,
    });
  },
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Generate a unique job ID.
 * Simple implementation using timestamp + random suffix.
 */
function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Create a new batch job for AI confirmation.
 *
 * 1. Fetches organizations ready for AI confirmation
 * 2. Generates JSONL batch file content
 * 3. Uploads to OpenAI and creates batch
 * 4. Records job in database (in "processing" status)
 */
export const createBatchJob = internalAction({
  args: {
    limit: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { limit, model }): Promise<{
    success: boolean;
    jobId: string | null;
    batchId: string | null;
    totalCount: number;
    error?: string;
  }> => {
    const batchSize = limit ?? DEFAULT_BATCH_SIZE;
    const modelName = model ?? DEFAULT_MODEL;

    try {
      // 1. Fetch organizations ready for AI confirmation
      const orgs = await ctx.runQuery(internal.openAiBatch.internalGetOrgsForAiConfirmation, {
        limit: batchSize,
      });

      if (orgs.length === 0) {
        console.log("No organizations found for AI confirmation");
        return {
          success: true,
          jobId: null,
          batchId: null,
          totalCount: 0,
        };
      }

      console.log(`Found ${orgs.length} organizations for AI confirmation`);

      // 2. Generate batch request lines
      const requestLines = orgs.map((org: OrgForAiConfirmation) =>
        createConfirmationRequestLine({
          ein: org.ein,
          name: org.name,
          street: org.street,
          city: org.city,
          state: org.state,
          codeDescription: org.nteeCode ?? "",
          websiteData: org.crawlData,
          model: modelName,
          responseSchema: WEBSITE_CONFIRMATION_SCHEMA,
        })
      );

      // 3. Convert to JSONL and upload to OpenAI
      const jsonlContent = toJSONL(requestLines);
      console.log(`Generated JSONL with ${requestLines.length} requests`);

      const uploadedFile = await uploadBatchFile(
        jsonlContent,
        `batch_${generateJobId()}.jsonl`
      );
      console.log(`Uploaded file to OpenAI: ${uploadedFile.id}`);

      // 4. Create batch job on OpenAI
      const jobId = generateJobId();
      const batch = await createBatch(uploadedFile.id, { jobId });
      console.log(`Created OpenAI batch: ${batch.id}`);

      // 5. Record job in database (directly in "processing" status)
      await ctx.runMutation(internal.batchJobs.internalCreate, {
        jobId,
        batchSize: orgs.length,
        batchId: batch.id,
      });

      return {
        success: true,
        jobId,
        batchId: batch.id,
        totalCount: orgs.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error creating batch job:", errorMessage);

      return {
        success: false,
        jobId: null,
        batchId: null,
        totalCount: 0,
        error: errorMessage,
      };
    }
  },
});

/**
 * Process results from a completed batch job.
 *
 * Downloads the output file, parses responses, and updates organizations.
 */
export const processResults = internalAction({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, { jobId }): Promise<{
    success: boolean;
    processedCount: number;
    errorCount: number;
    error?: string;
  }> => {
    try {
      // Get job from database
      const job = await ctx.runQuery(internal.batchJobs.internalGetByJobId, { jobId });

      if (!job) {
        return { success: false, processedCount: 0, errorCount: 0, error: "Job not found" };
      }

      if (!job.outputFileId) {
        return { success: false, processedCount: 0, errorCount: 0, error: "No output file ID" };
      }

      // Download output file from OpenAI
      console.log(`Downloading output file: ${job.outputFileId}`);
      const outputContent = await downloadFileContent(job.outputFileId);
      const responses = parseJSONL(outputContent);

      console.log(`Processing ${responses.length} responses`);

      let processedCount = 0;
      let errorCount = 0;

      // Process each response
      for (const response of responses) {
        try {
          // Extract EIN from custom_id (format: "EIN_TIMESTAMP")
          const ein = response.custom_id.split("_")[0];
          if (!ein) {
            console.warn(`Could not extract EIN from custom_id: ${response.custom_id}`);
            errorCount++;
            continue;
          }

          // Check for errors in response
          if (response.error) {
            console.warn(`Error for EIN ${ein}: ${response.error.message}`);
            errorCount++;
            continue;
          }

          // Get response content
          const content = response.response?.body?.choices?.[0]?.message?.content;
          if (!content) {
            console.warn(`No content in response for EIN ${ein}`);
            errorCount++;
            continue;
          }

          // Parse the response content
          const parsed = JSON.parse(content);

          // Get organization from database
          const org = await ctx.runQuery(internal.openAiBatch.internalGetOrgByEin, { ein });
          if (!org) {
            console.warn(`Organization not found for EIN ${ein}`);
            errorCount++;
            continue;
          }

          // Insert AI confirmation record
          await ctx.runMutation(internal.openAiBatch.internalInsertAiConfirmation, {
            ein,
            orgId: org._id,
            model: response.response?.body?.model ?? DEFAULT_MODEL,
            outputs: {
              hasCorrectWebsite: parsed.hasCorrectWebsite,
              correctWebsiteUrl: parsed.correctWebsiteUrl ?? undefined,
              mission: parsed.organizationMission ?? undefined,
              tagline: parsed.organizationTagline ?? undefined,
              oneSentenceSummary: parsed.organizationOneSentenceSummary ?? undefined,
              whySupport: parsed.whySupportOrganization ?? undefined,
              targetAudience: parsed.organizationTargetAudience ?? undefined,
              geographicFocus: parsed.organizationGeographicFocus ?? undefined,
              activityTags: parsed.organizationActivities ?? undefined,
              reasoning: parsed.reasoning ?? undefined,
            },
          });

          // Update organization if we found the correct website
          if (parsed.hasCorrectWebsite && parsed.correctWebsiteUrl) {
            // Validate geographicFocus is one of the allowed values
            const validGeographicFocus = ["Global", "National", "Regional", "Local"];
            const geoFocus = validGeographicFocus.includes(parsed.organizationGeographicFocus)
              ? parsed.organizationGeographicFocus
              : undefined;

            // Fetch crawl results to extract additional data (social media, logos, donation links)
            const crawlResults = await ctx.runQuery(
              internal.openAiBatch.internalGetCrawlResultsByEin,
              { ein }
            );

            // Process crawl data to extract social media URLs, logo, donation link, and emails
            const crawlExtractedData = processCrawlDataForConfirmedWebsite(
              crawlResults,
              parsed.correctWebsiteUrl
            );

            // Only include non-empty social media URLs object
            const socialMediaUrls =
              Object.keys(crawlExtractedData.socialMediaUrls).length > 0
                ? crawlExtractedData.socialMediaUrls
                : undefined;

            await ctx.runMutation(internal.openAiBatch.internalUpdateOrgWithAiResults, {
              orgId: org._id,
              updates: {
                websiteUrl: parsed.correctWebsiteUrl ?? undefined,
                mission: parsed.organizationMission ?? undefined,
                tagline: parsed.organizationTagline ?? undefined,
                oneSentenceSummary: parsed.organizationOneSentenceSummary ?? undefined,
                whySupport: parsed.whySupportOrganization ?? undefined,
                targetAudience: parsed.organizationTargetAudience ?? undefined,
                geographicFocus: geoFocus,
                activities: parsed.organizationActivities ?? undefined,
                keywords: parsed.organizationKeywords ?? undefined,
                // Crawl-extracted fields
                socialMediaUrls,
                donationUrl: crawlExtractedData.donationUrl,
                logoUrl: crawlExtractedData.logoUrl,
                emailAddresses:
                  crawlExtractedData.emailAddresses.length > 0
                    ? crawlExtractedData.emailAddresses
                    : undefined,
                enrichmentStage: "ai_confirmed",
              },
            });
          } else {
            // Even without website confirmation, update stage
            await ctx.runMutation(internal.openAiBatch.internalUpdateOrgWithAiResults, {
              orgId: org._id,
              updates: {
                enrichmentStage: "ai_confirmed",
              },
            });
          }

          processedCount++;
          console.log(`Processed EIN ${ein}`);
        } catch (parseError) {
          console.error(`Error processing response: ${parseError}`);
          errorCount++;
        }
      }

      // Update job status
      await ctx.runMutation(internal.batchJobs.internalMarkCompleted, {
        jobId,
        processedCount,
        errorCount,
      });

      console.log(`Completed processing job ${jobId}: ${processedCount} processed, ${errorCount} errors`);

      return {
        success: true,
        processedCount,
        errorCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing results for job ${jobId}:`, errorMessage);

      await ctx.runMutation(internal.batchJobs.internalMarkFailed, {
        jobId,
        error: errorMessage,
      });

      return {
        success: false,
        processedCount: 0,
        errorCount: 0,
        error: errorMessage,
      };
    }
  },
});

// ============================================================================
// Public Actions (for manual testing/debugging)
// ============================================================================

/**
 * Public action to manually trigger batch job creation.
 * Use for testing: npx convex run openAiBatch:manualCreateBatch '{"limit": 5}'
 */
export const manualCreateBatch = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }): Promise<{
    success: boolean;
    jobId: string | null;
    batchId: string | null;
    totalCount: number;
    error?: string;
  }> => {
    return await ctx.runAction(internal.openAiBatch.createBatchJob, { limit });
  },
});

/**
 * Public action to manually process batch results.
 * Use for testing: npx convex run openAiBatch:manualProcessResults '{"jobId": "..."}'
 */
export const manualProcessResults = action({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, { jobId }): Promise<{
    success: boolean;
    processedCount: number;
    errorCount: number;
    error?: string;
  }> => {
    return await ctx.runAction(internal.openAiBatch.processResults, { jobId });
  },
});

// ============================================================================
// Workflow Definition
// ============================================================================

/**
 * Workflow result types
 */
type BatchWorkflowResult =
  | {
      status: "no_work";
      totalCount: number;
      jobId: null;
    }
  | {
      status: "completed";
      jobId: string;
      processedCount: number;
      errorCount: number;
    };

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
      internal.openAiBatch.createBatchJob,
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
    const _completionEvent = await step.awaitEvent(batchCompletedEvent);

    // Step 3: Process results
    const processResult: {
      success: boolean;
      processedCount: number;
      errorCount: number;
      error?: string;
    } = await step.runAction(
      internal.openAiBatch.processResults,
      { jobId },
      { retry: true }
    );

    // Step 4: Chain to next workflow to continue processing
    // This starts a new workflow which will either process more orgs or end if none left
    await step.runAction(
      internal.openAiBatch.chainNextWorkflow,
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

// ============================================================================
// Workflow Orchestration Actions
// ============================================================================

/**
 * Polls OpenAI for completed batches and sends events to waiting workflows.
 * Called by cron every 15 minutes.
 */
export const pollAndNotifyCompletedBatches = internalAction({
  args: {},
  handler: async (ctx): Promise<{
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
      {}
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

          console.log(`Notified workflow ${job.workflowId} that batch ${job.jobId} completed`);
          notified++;
        } else if (isBatchFailed(batch.status)) {
          // Mark job as failed
          const errorMsg = batch.errors?.data?.[0]?.message ?? `Batch ${batch.status}`;
          await ctx.runMutation(internal.batchJobs.internalMarkFailed, {
            jobId: job.jobId,
            error: errorMsg,
          });

          // Cancel the workflow
          await workflow.cancel(ctx, job.workflowId as WorkflowId);
          console.log(`Canceled workflow ${job.workflowId} due to batch failure: ${errorMsg}`);
        }
      } catch (error) {
        console.error(`Error checking batch ${job.batchId}:`, error);
      }
    }

    console.log(`Checked ${processingJobs.length} jobs, notified ${notified} workflows`);
    return { checked: processingJobs.length, notified };
  },
});

/**
 * Start a new batch processing workflow if none are waiting.
 * Called by daily cron as a safety net.
 */
export const startBatchWorkflow = internalAction({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{
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
      {}
    );

    if (processingJobs.length > 0) {
      console.log("Batch already in progress:", processingJobs[0]!.jobId);
      return { started: false, reason: "batch_in_progress" };
    }

    // Start new workflow
    const workflowId = await workflow.start(
      ctx,
      internal.openAiBatch.batchProcessingWorkflow,
      { limit: args.limit }
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
  handler: async (ctx, args): Promise<{
    started: boolean;
    workflowId?: string;
  }> => {
    // Start next workflow in the chain
    const workflowId = await workflow.start(
      ctx,
      internal.openAiBatch.batchProcessingWorkflow,
      { limit: args.limit }
    );

    console.log("Chained next batch workflow:", workflowId);
    return { started: true, workflowId };
  },
});

// ============================================================================
// Webhook Handler
// ============================================================================

/**
 * OpenAI webhook event types we handle.
 */
interface OpenAIWebhookEvent {
  object: "event";
  id: string;
  type: "batch.completed" | "batch.failed";
  created_at: number;
  data: {
    id: string; // The batch ID
    output_file_id?: string;
    error_file_id?: string;
    errors?: {
      data?: Array<{ message?: string }>;
    };
  };
}

/**
 * Verify webhook signature using Standard Webhooks spec.
 * https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
 */
async function verifyWebhookSignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): Promise<boolean> {
  // Check timestamp is recent (within 5 minutes)
  const timestamp = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old or in future");
    return false;
  }

  // Build the signed payload: "webhook_id.timestamp.body"
  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;

  // The secret is base64 encoded with "whsec_" prefix
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;

  // Decode the base64 secret
  const keyBytes = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

  // Import the key for HMAC-SHA256
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign the payload
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(signedPayload)
  );

  // Convert to base64
  const expectedSignature =
    "v1," + btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // The webhook-signature header may contain multiple signatures separated by spaces
  const signatures = webhookSignature.split(" ");
  return signatures.some((sig) => sig === expectedSignature);
}

/**
 * Handle incoming OpenAI webhook.
 * Called by the HTTP endpoint when OpenAI sends batch.completed or batch.failed.
 */
export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    webhookId: v.string(),
    webhookTimestamp: v.string(),
    webhookSignature: v.string(),
  },
  handler: async (ctx, { body, webhookId, webhookTimestamp, webhookSignature }): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const webhookSecret = process.env.OPENAI_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("OPENAI_WEBHOOK_SECRET not configured");
      return { success: false, error: "Webhook secret not configured" };
    }

    // Verify signature
    const isValid = await verifyWebhookSignature(
      body,
      webhookId,
      webhookTimestamp,
      webhookSignature,
      webhookSecret
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return { success: false, error: "Invalid signature" };
    }

    // Parse the event
    let event: OpenAIWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch {
      console.error("Failed to parse webhook body");
      return { success: false, error: "Invalid JSON" };
    }

    console.log(`Received webhook: ${event.type} for batch ${event.data.id}`);

    // Find the batch job by OpenAI's batch ID
    const job = await ctx.runQuery(internal.batchJobs.internalGetByBatchId, {
      batchId: event.data.id,
    });

    if (!job) {
      console.warn(`No batch job found for batchId: ${event.data.id}`);
      // Return success anyway - might be a batch we don't track
      return { success: true };
    }

    if (!job.workflowId) {
      console.warn(`Batch job ${job.jobId} has no workflowId`);
      return { success: true };
    }

    if (event.type === "batch.completed") {
      const outputFileId = event.data.output_file_id;
      if (!outputFileId) {
        console.error("batch.completed event missing output_file_id");
        return { success: false, error: "Missing output_file_id" };
      }

      // Update job with output file ID
      await ctx.runMutation(internal.batchJobs.internalSetOutputFileId, {
        jobId: job.jobId,
        outputFileId,
      });

      // Send event to unblock the waiting workflow
      await workflow.sendEvent(ctx, {
        ...batchCompletedEvent,
        workflowId: job.workflowId as WorkflowId,
        value: { outputFileId },
      });

      console.log(`Notified workflow ${job.workflowId} that batch ${job.jobId} completed`);
    } else if (event.type === "batch.failed") {
      // Mark job as failed
      const errorMsg =
        event.data.errors?.data?.[0]?.message ?? "Batch failed (no error message)";

      await ctx.runMutation(internal.batchJobs.internalMarkFailed, {
        jobId: job.jobId,
        error: errorMsg,
      });

      // Cancel the workflow
      await workflow.cancel(ctx, job.workflowId as WorkflowId);
      console.log(`Canceled workflow ${job.workflowId} due to batch failure: ${errorMsg}`);
    }

    return { success: true };
  },
});

// ============================================================================
// Workflow Manual Triggers (for testing)
// ============================================================================

/**
 * Manually start a batch processing workflow.
 * npx convex run openAiBatch:manualStartWorkflow '{"limit": 5}'
 */
export const manualStartWorkflow = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{
    started: boolean;
    reason: string;
    workflowId?: string;
  }> => {
    return await ctx.runAction(internal.openAiBatch.startBatchWorkflow, args);
  },
});

/**
 * Manually trigger polling for completed batches.
 * npx convex run openAiBatch:manualPollBatches
 */
export const manualPollBatches = action({
  args: {},
  handler: async (ctx): Promise<{
    checked: number;
    notified: number;
  }> => {
    return await ctx.runAction(internal.openAiBatch.pollAndNotifyCompletedBatches, {});
  },
});
