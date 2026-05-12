/**
 * Core batch processing actions.
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  uploadBatchFile,
  downloadFileContent,
  createBatch,
  parseJSONL,
  toJSONL,
  createConfirmationRequestLine,
} from "../../lib/openAiBatch";
import { buildAiConfirmationApplication } from "../../lib/aiConfirmationApplication";
import { DEFAULT_BATCH_SIZE, DEFAULT_MODEL } from "./constants";
import type { OrgForAiConfirmation, OrgForAiConfirmationBase } from "./types";
import {
  WebsiteConfirmationSchema,
  type WebsiteConfirmation,
} from "@cause/lib";

const CRAWLED_ORG_PAGE_SIZE = 250;

type AiCandidateOrgsPage = {
  page: OrgForAiConfirmationBase[];
  isDone: boolean;
  continueCursor: string;
};

async function collectOrgsForAiConfirmation(
  ctx: ActionCtx,
  batchSize: number,
): Promise<{
  orgs: OrgForAiConfirmation[];
  scannedCount: number;
  skippedCount: number;
}> {
  const orgs: OrgForAiConfirmation[] = [];
  let scannedCount = 0;
  let skippedCount = 0;
  for (const stage of ["crawled", "local_ai_reviewed"] as const) {
    let cursor: string | null = null;
    let isDone = false;

    while (orgs.length < batchSize && !isDone) {
      const candidateOrgs = (await ctx.runQuery(
        internal.batch.queries.internalListAiCandidateOrgsPage,
        {
          stage,
          paginationOpts: {
            numItems: Math.max(batchSize, CRAWLED_ORG_PAGE_SIZE),
            cursor,
          },
        },
      )) as AiCandidateOrgsPage;

      for (const org of candidateOrgs.page) {
        if (orgs.length >= batchSize) {
          break;
        }

        scannedCount++;

        try {
          const crawlData = await ctx.runQuery(
            internal.batch.queries.internalGetSelectedCrawlDataForEin,
            { ein: org.ein },
          );

          if (crawlData.length === 0) {
            skippedCount++;
            continue;
          }

          orgs.push({
            ...org,
            crawlData,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `Skipping EIN ${org.ein} while preparing batch prompt data: ${errorMessage}`,
          );
          skippedCount++;
        }
      }

      isDone = candidateOrgs.isDone;
      cursor = candidateOrgs.continueCursor;
    }
  }

  return {
    orgs,
    scannedCount,
    skippedCount,
  };
}

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
      // 1. Scan crawled orgs until we fill the batch or exhaust the queue.
      const { orgs, scannedCount, skippedCount } =
        await collectOrgsForAiConfirmation(ctx, batchSize);

      if (orgs.length === 0) {
        console.log(
          `No organizations found for AI confirmation after scanning ${scannedCount} crawled orgs`,
        );
        return {
          success: true,
          jobId: null,
          batchId: null,
          totalCount: 0,
        };
      }

      console.log(
        `Prepared ${orgs.length} organizations for AI confirmation after scanning ${scannedCount} crawled orgs and skipping ${skippedCount}`,
      );

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
          responseSchema: WebsiteConfirmationSchema,
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

          const parseResult = WebsiteConfirmationSchema.safeParse(
            JSON.parse(content),
          );
          if (!parseResult.success) {
            console.warn(
              `Invalid AI confirmation payload for EIN ${ein}: ${parseResult.error.message}`,
            );
            errorCount++;
            continue;
          }
          const parsed: WebsiteConfirmation = parseResult.data;
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

          const crawlResults = await ctx.runQuery(
            internal.batch.queries.internalGetCrawlResultsByEin,
            { ein },
          );
          const application = buildAiConfirmationApplication({
            confirmation: parsed,
            crawlResults,
            fallbackStage: "ai_confirmed",
          });

          await ctx.runMutation(
            internal.batch.mutations.internalInsertAiConfirmation,
            {
              ein,
              orgId: org._id,
              model: response.response?.body?.model ?? DEFAULT_MODEL,
              outputs: application.outputs,
            },
          );
          await ctx.runMutation(
            internal.batch.mutations.internalUpdateOrgWithAiResults,
            {
              orgId: org._id,
              updates: application.updates,
            },
          );

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
