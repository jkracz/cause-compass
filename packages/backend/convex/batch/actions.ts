/**
 * Core batch processing actions.
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  uploadBatchFile,
  downloadFileContent,
  createBatch,
  parseJSONL,
  toJSONL,
  createConfirmationRequestLine,
} from "../../lib/openAiBatch";
import { processCrawlDataForConfirmedWebsite } from "../../lib/batchResponseProcessing";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MODEL,
  WEBSITE_CONFIRMATION_SCHEMA,
} from "./constants";
import type { OrgForAiConfirmation } from "./types";
import type { AiConfirmationResponse, GeographicFocusType } from "@cause/types";

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
  handler: async (
    ctx,
    { limit, model },
  ): Promise<{
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
      const orgs = await ctx.runQuery(
        internal.batch.queries.internalGetOrgsForAiConfirmation,
        {
          limit: batchSize,
        },
      );

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
        }),
      );

      // 3. Convert to JSONL and upload to OpenAI
      const jsonlContent = toJSONL(requestLines);
      console.log(`Generated JSONL with ${requestLines.length} requests`);

      const uploadedFile = await uploadBatchFile(
        jsonlContent,
        `batch_${generateJobId()}.jsonl`,
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
  handler: async (
    ctx,
    { jobId },
  ): Promise<{
    success: boolean;
    processedCount: number;
    errorCount: number;
    error?: string;
  }> => {
    try {
      // Get job from database
      const job = await ctx.runQuery(internal.batchJobs.internalGetByJobId, {
        jobId,
      });

      if (!job) {
        return {
          success: false,
          processedCount: 0,
          errorCount: 0,
          error: "Job not found",
        };
      }

      if (!job.outputFileId) {
        return {
          success: false,
          processedCount: 0,
          errorCount: 0,
          error: "No output file ID",
        };
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
            console.warn(
              `Could not extract EIN from custom_id: ${response.custom_id}`,
            );
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
          const content =
            response.response?.body?.choices?.[0]?.message?.content;
          if (!content) {
            console.warn(`No content in response for EIN ${ein}`);
            errorCount++;
            continue;
          }

          // Parse the response content
          const parsed = JSON.parse(content) as AiConfirmationResponse;

          // Get organization from database
          const org = await ctx.runQuery(
            internal.batch.queries.internalGetOrgByEin,
            { ein },
          );
          if (!org) {
            console.warn(`Organization not found for EIN ${ein}`);
            errorCount++;
            continue;
          }

          // Insert AI confirmation record
          await ctx.runMutation(
            internal.batch.mutations.internalInsertAiConfirmation,
            {
              ein,
              orgId: org._id,
              model: response.response?.body?.model ?? DEFAULT_MODEL,
              outputs: {
                hasCorrectWebsite: parsed.hasCorrectWebsite,
                correctWebsiteUrl: parsed.correctWebsiteUrl ?? undefined,
                mission: parsed.organizationMission ?? undefined,
                tagline: parsed.organizationTagline ?? undefined,
                oneSentenceSummary:
                  parsed.organizationOneSentenceSummary ?? undefined,
                whySupport: parsed.whySupportOrganization ?? undefined,
                targetAudience: parsed.organizationTargetAudience ?? undefined,
                geographicFocus:
                  parsed.organizationGeographicFocus ?? undefined,
                activityTags: parsed.organizationActivities ?? undefined,
                reasoning: parsed.reasoning ?? undefined,
              },
            },
          );

          // Update organization if we found the correct website
          if (parsed.hasCorrectWebsite && parsed.correctWebsiteUrl) {
            // Validate geographicFocus is one of the allowed values
            const validGeographicFocus: GeographicFocusType[] = [
              "Global",
              "National",
              "Regional",
              "Local",
            ];
            const geoFocus =
              parsed.organizationGeographicFocus &&
              validGeographicFocus.includes(parsed.organizationGeographicFocus)
                ? parsed.organizationGeographicFocus
                : undefined;

            // Fetch crawl results to extract additional data (social media, logos, donation links)
            const crawlResults = await ctx.runQuery(
              internal.batch.queries.internalGetCrawlResultsByEin,
              { ein },
            );

            // Process crawl data to extract social media URLs, logo, donation link, and emails
            const crawlExtractedData = processCrawlDataForConfirmedWebsite(
              crawlResults,
              parsed.correctWebsiteUrl,
            );

            // Only include non-empty social media URLs object
            const socialMediaUrls =
              Object.keys(crawlExtractedData.socialMediaUrls).length > 0
                ? crawlExtractedData.socialMediaUrls
                : undefined;

            await ctx.runMutation(
              internal.batch.mutations.internalUpdateOrgWithAiResults,
              {
                orgId: org._id,
                updates: {
                  websiteUrl: parsed.correctWebsiteUrl ?? undefined,
                  mission: parsed.organizationMission ?? undefined,
                  tagline: parsed.organizationTagline ?? undefined,
                  oneSentenceSummary:
                    parsed.organizationOneSentenceSummary ?? undefined,
                  whySupport: parsed.whySupportOrganization ?? undefined,
                  targetAudience:
                    parsed.organizationTargetAudience ?? undefined,
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
              },
            );
          } else {
            // Even without website confirmation, update stage
            await ctx.runMutation(
              internal.batch.mutations.internalUpdateOrgWithAiResults,
              {
                orgId: org._id,
                updates: {
                  enrichmentStage: "ai_confirmed",
                },
              },
            );
          }

          processedCount++;
          console.log(`Processed EIN ${ein}`);
        } catch (parseError: unknown) {
          const errorMsg =
            parseError instanceof Error
              ? parseError.message
              : String(parseError);
          console.error(`Error processing response: ${errorMsg}`);
          errorCount++;
        }
      }

      // Update job status
      await ctx.runMutation(internal.batchJobs.internalMarkCompleted, {
        jobId,
        processedCount,
        errorCount,
      });

      console.log(
        `Completed processing job ${jobId}: ${processedCount} processed, ${errorCount} errors`,
      );

      return {
        success: true,
        processedCount,
        errorCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
