/**
 * Aggregate definitions for pipeline health metrics.
 *
 * Organizations are indexed by enrichmentStage (namespace) and updatedAt
 * (sortKey). Sentinel value 0 represents missing updatedAt.
 *
 * This enables O(log n) counts per stage and stale detection via range bounds,
 * with no read-limit concerns regardless of table size.
 */

import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
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

// ---------------------------------------------------------------------------
// All writes to the organizations table should go through these helpers
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
