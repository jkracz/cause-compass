/**
 * Type definitions for batch processing.
 */

import type { Id } from "../_generated/dataModel";

// Re-export types from lib files for convenience
export type { CrawlItemData } from "../../lib/batchResponseProcessing";

export interface OrgForAiConfirmationBase {
  _id: Id<"organizations">;
  ein: string;
  name: string;
  street: string;
  city: string;
  state: string;
  nteeCode: string | undefined;
}

/**
 * Organization data ready for AI confirmation
 */
export interface OrgForAiConfirmation extends OrgForAiConfirmationBase {
  crawlData: Array<{
    url: string;
    title: string;
    textContent: string;
  }>;
}

/**
 * OpenAI webhook event types we handle.
 */
export interface OpenAIWebhookEvent {
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
 * Workflow result types
 */
export type BatchWorkflowResult =
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
