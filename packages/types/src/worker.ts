import type { TaxExemptOrganization } from "./organization";
import type { CrawlItem } from "./search";

/**
 * Type definitions for worker processes.
 */

/**
 * Extended organization data returned from confirmation crawl worker.
 */
export interface WorkerOrgData extends TaxExemptOrganization {
  confirmationCrawlItems?: CrawlItem[];
  resultsParsedAt?: string;
}

/**
 * Error message structure from worker processes.
 */
export interface WorkerErrorMessage {
  error: string;
  stack?: string;
  orgData?: string;
}

/**
 * Union type for messages received from worker processes.
 */
export type WorkerMessage = WorkerOrgData | WorkerErrorMessage;

/**
 * Type guard to check if a worker message is an error.
 */
export function isWorkerError(msg: WorkerMessage): msg is WorkerErrorMessage {
  return "error" in msg && typeof msg.error === "string";
}

/**
 * Message structure sent to worker processes.
 */
export interface WorkerProcessMessage {
  action: string;
}
