/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates from "../aggregates.js";
import type * as batch_actions from "../batch/actions.js";
import type * as batch_constants from "../batch/constants.js";
import type * as batch_index from "../batch/index.js";
import type * as batch_manual from "../batch/manual.js";
import type * as batch_mutations from "../batch/mutations.js";
import type * as batch_orchestration from "../batch/orchestration.js";
import type * as batch_queries from "../batch/queries.js";
import type * as batch_types from "../batch/types.js";
import type * as batch_webhook from "../batch/webhook.js";
import type * as batch_workflow from "../batch/workflow.js";
import type * as batchJobs from "../batchJobs.js";
import type * as comparison from "../comparison.js";
import type * as crawlQueue from "../crawlQueue.js";
import type * as crawlQueueCron from "../crawlQueueCron.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_recommendations from "../lib/recommendations.js";
import type * as lib_viewer from "../lib/viewer.js";
import type * as migrations from "../migrations.js";
import type * as organizations from "../organizations.js";
import type * as pipelineHealth from "../pipelineHealth.js";
import type * as searchOrgs from "../searchOrgs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aggregates: typeof aggregates;
  "batch/actions": typeof batch_actions;
  "batch/constants": typeof batch_constants;
  "batch/index": typeof batch_index;
  "batch/manual": typeof batch_manual;
  "batch/mutations": typeof batch_mutations;
  "batch/orchestration": typeof batch_orchestration;
  "batch/queries": typeof batch_queries;
  "batch/types": typeof batch_types;
  "batch/webhook": typeof batch_webhook;
  "batch/workflow": typeof batch_workflow;
  batchJobs: typeof batchJobs;
  comparison: typeof comparison;
  crawlQueue: typeof crawlQueue;
  crawlQueueCron: typeof crawlQueueCron;
  crons: typeof crons;
  http: typeof http;
  "lib/recommendations": typeof lib_recommendations;
  "lib/viewer": typeof lib_viewer;
  migrations: typeof migrations;
  organizations: typeof organizations;
  pipelineHealth: typeof pipelineHealth;
  searchOrgs: typeof searchOrgs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  aggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregate">;
  queueStatsAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"queueStatsAggregate">;
};
