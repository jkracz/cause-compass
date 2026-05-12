import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { runBackfillSearchedOrgs } from "./crawlQueue";

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

type ScheduledRecoverResult =
  | {
      skipped: true;
      reason: string;
    }
  | {
      skipped: false;
      recovered: number;
    };

type ScheduledBackfillResult =
  | {
      skipped: true;
      reason: string;
    }
  | {
      skipped: false;
      enqueued: number;
    };

/**
 * Cron wrapper for stale job recovery.
 * Runs only when ENABLE_CRAWL_CRON=true.
 */
export const scheduledRecoverStaleJobs = internalAction({
  args: {},
  returns: v.object({
    skipped: v.boolean(),
    recovered: v.optional(v.number()),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx): Promise<ScheduledRecoverResult> => {
    const isEnabled = process.env.ENABLE_CRAWL_CRON === "true";
    if (!isEnabled) {
      console.log(
        "Crawl stale recovery cron disabled (ENABLE_CRAWL_CRON !== 'true')",
      );
      return {
        skipped: true,
        reason: "ENABLE_CRAWL_CRON not set to true",
      };
    }

    const recovered = await ctx.runMutation(
      internal.crawlQueue.recoverStaleJobs,
      {},
    );

    return {
      skipped: false,
      recovered,
    };
  },
});

/**
 * Cron wrapper for crawl queue backfill.
 * Runs only when ENABLE_CRAWL_BACKFILL_CRON=true.
 */
export const scheduledBackfillSearchedOrgs = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    skipped: v.boolean(),
    enqueued: v.optional(v.number()),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, { limit }): Promise<ScheduledBackfillResult> => {
    const isEnabled = process.env.ENABLE_CRAWL_BACKFILL_CRON === "true";
    if (!isEnabled) {
      console.log(
        "Crawl backfill cron disabled (ENABLE_CRAWL_BACKFILL_CRON !== 'true')",
      );
      return {
        skipped: true,
        reason: "ENABLE_CRAWL_BACKFILL_CRON not set to true",
      };
    }

    const enqueued = await runBackfillSearchedOrgs(ctx, limit);

    return {
      skipped: false,
      enqueued,
    };
  },
});
