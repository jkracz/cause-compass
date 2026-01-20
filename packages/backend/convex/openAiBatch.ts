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
import {
  uploadBatchFile,
  createBatch,
  getBatch,
  downloadFileContent,
  parseJSONL,
  toJSONL,
  createConfirmationRequestLine,
  isBatchProcessing,
  isBatchCompleted,
  isBatchFailed,
  type BatchResponseLine,
  type OpenAIBatchStatus,
} from "./lib/openAiBatch";
import {
  processCrawlDataForConfirmedWebsite,
  type CrawlItemData,
  type SocialMediaUrls,
} from "./lib/batchResponseProcessing";

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
 * 3. Uploads to OpenAI
 * 4. Creates the batch job
 * 5. Records job in database
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
    fileId: string | null;
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
          fileId: null,
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

      // 3. Convert to JSONL
      const jsonlContent = toJSONL(requestLines);
      console.log(`Generated JSONL with ${requestLines.length} requests`);

      // 4. Create job record in database
      const jobId = generateJobId();
      await ctx.runMutation(internal.batchJobs.internalCreate, {
        jobId,
        batchSize: orgs.length,
        totalCount: orgs.length,
      });

      // 5. Update status to generating
      await ctx.runMutation(internal.batchJobs.internalUpdateStatus, {
        jobId,
        status: "generating",
      });

      // 6. Upload file to OpenAI
      await ctx.runMutation(internal.batchJobs.internalUpdateStatus, {
        jobId,
        status: "uploading",
      });

      const uploadedFile = await uploadBatchFile(
        jsonlContent,
        `batch_${jobId}.jsonl`
      );
      console.log(`Uploaded file to OpenAI: ${uploadedFile.id}`);

      // 7. Create batch job on OpenAI
      const batch = await createBatch(uploadedFile.id, { jobId });
      console.log(`Created OpenAI batch: ${batch.id}`);

      // 8. Update job with OpenAI references
      await ctx.runMutation(internal.batchJobs.internalUpdateOpenAIRefs, {
        jobId,
        fileId: uploadedFile.id,
        batchId: batch.id,
      });

      await ctx.runMutation(internal.batchJobs.internalUpdateStatus, {
        jobId,
        status: "processing",
      });

      return {
        success: true,
        jobId,
        batchId: batch.id,
        fileId: uploadedFile.id,
        totalCount: orgs.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error creating batch job:", errorMessage);

      return {
        success: false,
        jobId: null,
        batchId: null,
        fileId: null,
        totalCount: 0,
        error: errorMessage,
      };
    }
  },
});

/**
 * Check the status of a batch job.
 *
 * Polls OpenAI for the batch status and updates the local record.
 */
export const checkBatchStatus = internalAction({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, { jobId }): Promise<{
    status: "processing" | "downloading" | "failed" | "not_found";
    openAiStatus?: OpenAIBatchStatus;
    outputFileId?: string;
    error?: string;
  }> => {
    try {
      // Get job from database
      const job = await ctx.runQuery(internal.batchJobs.internalGetByJobId, { jobId });

      if (!job) {
        return { status: "not_found", error: "Job not found" };
      }

      if (!job.batchId) {
        return { status: "failed", error: "Job has no batch ID" };
      }

      // Check status on OpenAI
      const batch = await getBatch(job.batchId);
      console.log(`Batch ${job.batchId} status: ${batch.status}`);

      if (isBatchCompleted(batch.status)) {
        // Update job with output file ID
        await ctx.runMutation(internal.batchJobs.internalUpdateOpenAIRefs, {
          jobId,
          outputFileId: batch.output_file_id ?? undefined,
        });

        await ctx.runMutation(internal.batchJobs.internalUpdateStatus, {
          jobId,
          status: "downloading",
        });

        return {
          status: "downloading",
          openAiStatus: batch.status,
          outputFileId: batch.output_file_id ?? undefined,
        };
      }

      if (isBatchFailed(batch.status)) {
        const errorMsg = batch.errors?.data?.[0]?.message ?? `Batch ${batch.status}`;
        await ctx.runMutation(internal.batchJobs.internalMarkFailed, {
          jobId,
          error: errorMsg,
        });

        return {
          status: "failed",
          openAiStatus: batch.status,
          error: errorMsg,
        };
      }

      // Still processing
      return {
        status: "processing",
        openAiStatus: batch.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error checking batch status for job ${jobId}:`, errorMessage);

      return {
        status: "failed",
        error: errorMessage,
      };
    }
  },
});

/**
 * Check status of all processing jobs.
 */
export const checkAllProcessingJobs = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    checked: number;
    completed: number;
    failed: number;
    stillProcessing: number;
  }> => {
    const jobs = await ctx.runQuery(internal.batchJobs.internalGetProcessingJobs, {});

    let completed = 0;
    let failed = 0;
    let stillProcessing = 0;

    for (const job of jobs) {
      const result = await ctx.runAction(internal.openAiBatch.checkBatchStatus, {
        jobId: job.jobId,
      });

      if (result.status === "downloading") {
        completed++;
      } else if (result.status === "failed") {
        failed++;
      } else {
        stillProcessing++;
      }
    }

    console.log(
      `Checked ${jobs.length} jobs: ${completed} completed, ${failed} failed, ${stillProcessing} still processing`
    );

    return {
      checked: jobs.length,
      completed,
      failed,
      stillProcessing,
    };
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

/**
 * Main orchestration action: check and process batches.
 *
 * Similar to BatchManager.checkAndProcessBatch() from parsley.
 * - Checks for active batch jobs
 * - Processes completed batches
 * - Starts new batches if none active
 */
export const checkAndProcessBatch = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }): Promise<{
    action: "created" | "processed" | "waiting" | "none" | "error";
    jobId?: string;
    details?: string;
  }> => {
    const isEnabled = process.env.ENABLE_BATCH_CRON === "true";

    if (!isEnabled) {
      console.log("Batch processing is disabled (ENABLE_BATCH_CRON !== 'true'). Skipping.");
      return { action: "none", details: "ENABLE_BATCH_CRON not set to true" };
    }

    try {
      // Check for processing jobs
      const processingJobs = await ctx.runQuery(internal.batchJobs.internalGetProcessingJobs, {});

      if (processingJobs.length > 0) {
        // Check status of first processing job
        const job = processingJobs[0]!;
        const result = await ctx.runAction(internal.openAiBatch.checkBatchStatus, {
          jobId: job.jobId,
        });

        if (result.status === "downloading") {
          // Process the completed batch
          const processResult = await ctx.runAction(internal.openAiBatch.processResults, {
            jobId: job.jobId,
          });

          if (processResult.success) {
            // Start a new batch after processing
            const createResult = await ctx.runAction(internal.openAiBatch.createBatchJob, {
              limit,
            });

            if (createResult.success && createResult.jobId) {
              return {
                action: "created",
                jobId: createResult.jobId,
                details: `Processed ${processResult.processedCount} results, started new batch with ${createResult.totalCount} orgs`,
              };
            }
          }

          return {
            action: "processed",
            jobId: job.jobId,
            details: `Processed ${processResult.processedCount} results`,
          };
        }

        if (result.status === "failed") {
          // Start a new batch after failure
          const createResult = await ctx.runAction(internal.openAiBatch.createBatchJob, {
            limit,
          });

          if (createResult.success && createResult.jobId) {
            return {
              action: "created",
              jobId: createResult.jobId,
              details: `Previous job failed, started new batch with ${createResult.totalCount} orgs`,
            };
          }
        }

        // Still processing
        return {
          action: "waiting",
          jobId: job.jobId,
          details: `Batch still processing (${result.openAiStatus})`,
        };
      }

      // Check for downloading jobs (completed but not processed)
      const downloadingJobs = await ctx.runQuery(internal.batchJobs.internalListByStatus, {
        status: "downloading",
        limit: 1,
      });

      if (downloadingJobs.length > 0) {
        const job = downloadingJobs[0]!;
        const processResult = await ctx.runAction(internal.openAiBatch.processResults, {
          jobId: job.jobId,
        });

        // Start a new batch after processing
        const createResult = await ctx.runAction(internal.openAiBatch.createBatchJob, {
          limit,
        });

        return {
          action: "processed",
          jobId: job.jobId,
          details: `Processed ${processResult.processedCount} results${createResult.jobId ? `, started new batch ${createResult.jobId}` : ""}`,
        };
      }

      // No active jobs, start a new one
      const createResult = await ctx.runAction(internal.openAiBatch.createBatchJob, {
        limit,
      });

      if (createResult.success && createResult.jobId) {
        return {
          action: "created",
          jobId: createResult.jobId,
          details: `Started new batch with ${createResult.totalCount} orgs`,
        };
      }

      if (createResult.totalCount === 0) {
        return {
          action: "none",
          details: "No organizations ready for AI confirmation",
        };
      }

      return {
        action: "error",
        details: createResult.error ?? "Unknown error creating batch",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error in checkAndProcessBatch:", errorMessage);

      return {
        action: "error",
        details: errorMessage,
      };
    }
  },
});

/**
 * Scheduled wrapper for the batch processing job.
 * Set ENABLE_BATCH_CRON=true in Convex Dashboard for production.
 */
export const scheduledBatchProcessing = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    action: "created" | "processed" | "waiting" | "none" | "error";
    jobId?: string;
    details?: string;
  }> => {
    return await ctx.runAction(internal.openAiBatch.checkAndProcessBatch, {});
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
    fileId: string | null;
    totalCount: number;
    error?: string;
  }> => {
    return await ctx.runAction(internal.openAiBatch.createBatchJob, { limit });
  },
});

/**
 * Public action to manually check batch status.
 * Use for testing: npx convex run openAiBatch:manualCheckStatus '{"jobId": "..."}'
 */
export const manualCheckStatus = action({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, { jobId }): Promise<{
    status: "processing" | "downloading" | "failed" | "not_found";
    openAiStatus?: OpenAIBatchStatus;
    outputFileId?: string;
    error?: string;
  }> => {
    return await ctx.runAction(internal.openAiBatch.checkBatchStatus, { jobId });
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
