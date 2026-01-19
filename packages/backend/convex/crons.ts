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
  internal.searchOrgs.scheduledSearchOrganizations
);

export default crons;
