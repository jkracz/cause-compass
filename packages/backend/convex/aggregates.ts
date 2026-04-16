/**
 * Aggregate definitions for pipeline health and crawl queue metrics.
 */

import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const orgStageAggregate = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "organizations";
  Namespace: string;
}>(components.aggregate, {
  sortKey: (doc) => doc.updatedAt ?? 0,
  namespace: (doc) => doc.enrichmentStage,
});

export const crawlQueueStatusAggregate = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "crawlQueue";
  Namespace: string;
}>(components.queueStatsAggregate, {
  sortKey: (doc) => doc.createdAt,
  namespace: (doc) => getCrawlQueueStatusNamespace(doc.queueType, doc.status),
});

// ---------------------------------------------------------------------------
// All writes to the tracked tables should go through these helpers
// so the aggregate stays in sync automatically.
// ---------------------------------------------------------------------------

export async function patchOrganization(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  updates: Record<string, unknown>,
) {
  const oldDoc = await ctx.db.get(orgId);
  await ctx.db.patch(orgId, updates as never);
  const newDoc = await ctx.db.get(orgId);
  if (oldDoc && newDoc) {
    await orgStageAggregate.replaceOrInsert(ctx, oldDoc, newDoc);
  }
}

type CrawlQueueStatus = Doc<"crawlQueue">["status"];
type CrawlQueueType = Doc<"crawlQueue">["queueType"];
type CrawlQueueInsert = Omit<Doc<"crawlQueue">, "_id" | "_creationTime">;

export function getCrawlQueueStatusNamespace(
  queueType: CrawlQueueType,
  status: CrawlQueueStatus,
) {
  return `${queueType}:${status}`;
}

export async function insertCrawlQueueJob(
  ctx: MutationCtx,
  value: CrawlQueueInsert,
): Promise<Id<"crawlQueue">> {
  const jobId = await ctx.db.insert("crawlQueue", value);
  const insertedDoc = await ctx.db.get(jobId);
  if (insertedDoc) {
    await crawlQueueStatusAggregate.insertIfDoesNotExist(ctx, insertedDoc);
  }
  return jobId;
}

export async function patchCrawlQueueJob(
  ctx: MutationCtx,
  jobId: Id<"crawlQueue">,
  updates: Record<string, unknown>,
): Promise<Doc<"crawlQueue">> {
  const oldDoc = await ctx.db.get(jobId);
  if (!oldDoc) {
    throw new Error(`Crawl queue job ${jobId} not found`);
  }

  await ctx.db.patch(jobId, updates as never);

  const newDoc = await ctx.db.get(jobId);
  if (!newDoc) {
    throw new Error(`Crawl queue job ${jobId} disappeared after patch`);
  }

  await crawlQueueStatusAggregate.replaceOrInsert(ctx, oldDoc, newDoc);
  return newDoc;
}
