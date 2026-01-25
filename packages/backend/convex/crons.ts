/**
 * Convex Cron Jobs
 *
 * This file defines scheduled tasks that run automatically.
 * Deploy changes with: npx convex deploy
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily organization search job.
 * Runs at midnight UTC every day.
 *
 * Only executes in production when ENABLE_SEARCH_CRON=true is set.
 * In dev, the cron will still trigger but skip execution - use manual testing instead:
 *   npx convex run searchOrgs:searchOrganizations '{"limit": 1}'
 */
crons.daily(
  "search-organizations",
  { hourUTC: 0, minuteUTC: 0 },
  internal.searchOrgs.scheduledSearchOrganizations,
);

/**
 * Daily: Safety net to start batch workflows.
 * Starts a workflow if none is currently processing.
 *
 * Normally, workflows chain themselves after completing (each workflow starts
 * the next one). This daily cron acts as a safety net to restart processing
 * if the chain breaks or runs out of work and new orgs become available.
 *
 * Only executes in production when ENABLE_BATCH_CRON=true is set.
 * In dev, use manual testing instead:
 *   npx convex run batch/manual:manualStartWorkflow '{"limit": 5}'
 *
 * Note: Batch completion is handled by OpenAI webhooks (no polling needed).
 * Set up webhook at: https://platform.openai.com/settings/project/webhooks
 * Endpoint URL: https://<your-deployment>.convex.site/openai-webhook
 * Events: batch.completed, batch.failed
 */
crons.daily(
  "start-batch-workflow",
  { hourUTC: 1, minuteUTC: 0 },
  internal.batch.orchestration.startBatchWorkflow,
  {},
);

export default crons;
