/**
 * Batch processing module.
 *
 * Re-exports all batch processing functionality for clean external imports.
 *
 * Usage from other Convex modules:
 *   internal.batch.actions.createBatchJob
 *   internal.batch.workflow.batchProcessingWorkflow
 *   internal.batch.orchestration.startBatchWorkflow
 *   internal.batch.webhook.handleWebhook
 *
 * Usage from CLI:
 *   npx convex run batch/manual:manualCreateBatch '{"limit": 5}'
 *   npx convex run batch/manual:manualStartWorkflow '{"limit": 5}'
 */

// Types
export type {
  OrgForAiConfirmation,
  OpenAIWebhookEvent,
  BatchWorkflowResult,
  CrawlItemData,
} from "./types";

// Constants
export { DEFAULT_BATCH_SIZE, DEFAULT_MODEL } from "./constants";

// Workflow exports (for direct access to workflow manager and events)
export {
  workflow,
  batchCompletedEvent,
  batchProcessingWorkflow,
} from "./workflow";
