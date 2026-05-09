# Convex Backend

This directory contains the Convex backend functions for Cause Compass.

## Auth Setup

Convex trusts the Better Auth component as a custom JWT provider via `convex/auth.config.ts`.

Set these environment variables in the Convex dashboard before running `convex dev` or deploying:

```bash
BETTER_AUTH_SECRET=<random-secret>
SITE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

`SITE_URL` must exactly match the browser origin used by the web app. Google OAuth redirect URIs should point at `/api/auth/callback/google` on that origin.

## Batch Processing Workflow

The batch processing system uses OpenAI's Batch API to enrich organization data with AI-generated content. It's built on the `@convex-dev/workflow` component for durable, event-driven orchestration.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Daily Cron (1am UTC) - Safety Net                                  │
│  → Starts workflow if none processing                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Workflow: batchProcessingWorkflow                                  │
│  1. createBatchJob → uploads to OpenAI                              │
│  2. awaitEvent → waits for webhook                                  │
│  3. processResults → processes results                              │
│  4. chainNextWorkflow → starts next workflow                        │
│                                                                     │
│  Chain continues until no more orgs to process                      │
└─────────────────────────────────────────────────────────────────────┘
                           ↑
                           │ webhook
                           │
┌─────────────────────────────────────────────────────────────────────┐
│  HTTP Endpoint: /openai-webhook                                     │
│  Receives batch.completed / batch.failed from OpenAI                │
└─────────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Daily cron** starts a workflow (or use manual trigger)
2. **Workflow** creates a batch job, uploads to OpenAI Batch API
3. **Workflow pauses** waiting for the `batchCompleted` event
4. **OpenAI processes** the batch (can take minutes to hours)
5. **Webhook fires** when OpenAI completes, sends event to workflow
6. **Workflow resumes**, processes results, updates organizations
7. **Workflow chains** to start the next workflow
8. **Chain continues** until no more organizations need enrichment

### Setup

#### 1. Environment Variables

Set these in the Convex Dashboard (Settings → Environment Variables):

```bash
# Enable batch processing
ENABLE_BATCH_CRON=true

# OpenAI webhook signing secret (from step 2)
OPENAI_WEBHOOK_SECRET=whsec_...
```

#### 2. Configure OpenAI Webhook

1. Go to https://platform.openai.com/settings/project/webhooks
2. Click "Create" to add a new webhook endpoint
3. Configure:
   - **URL**: `https://<your-deployment>.convex.site/openai-webhook`
   - **Events**: Select `batch.completed` and `batch.failed`
4. Copy the signing secret to `OPENAI_WEBHOOK_SECRET` env var

#### 3. Deploy

```bash
npx convex deploy
```

### Manual Testing

```bash
# Start a workflow manually (processes up to 20 orgs by default)
npx convex run batch/manual:manualStartWorkflow

# Start with a custom limit
npx convex run batch/manual:manualStartWorkflow '{"limit": 5}'

# Check batch job status
npx convex run batchJobs:listAll

# Manually create a batch (without workflow)
npx convex run batch/manual:manualCreateBatch '{"limit": 5}'

# Manually process results (if needed)
npx convex run batch/manual:manualProcessResults '{"jobId": "..."}'

# Manually poll for completed batches
npx convex run batch/manual:manualPollBatches

# Promote existing ai_confirmed orgs with a confirmed website to ready
npx convex run migrations:runPromoteConfirmedOrgsToReady '{"cursor": null}'

# Repair pipeline health aggregate after imports or aggregate drift
npx convex run pipelineHealth:resetAggregate

# Backfill crawl queue status aggregate after deploying queue stats changes
npx convex run crawlQueue:backfillQueueStatsAggregate '{"cursor": null}'
```

### Files

| File                             | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `batch/workflow.ts`              | WorkflowManager, batchCompletedEvent, batchProcessingWorkflow                                 |
| `batch/actions.ts`               | Core actions (createBatchJob, processResults)                                                 |
| `batch/orchestration.ts`         | Workflow orchestration (startBatchWorkflow, chainNextWorkflow, pollAndNotifyCompletedBatches) |
| `batch/webhook.ts`               | OpenAI webhook handler with signature verification                                            |
| `batch/queries.ts`               | Internal queries for fetching org and crawl data                                              |
| `batch/mutations.ts`             | Internal mutations for updating orgs with AI results                                          |
| `batch/manual.ts`                | Public actions for manual testing                                                             |
| `batch/types.ts`                 | Type definitions                                                                              |
| `batch/constants.ts`             | Constants and JSON schema                                                                     |
| `batchJobs.ts`                   | CRUD operations for the `batchJobs` table                                                     |
| `http.ts`                        | HTTP endpoint for OpenAI webhooks                                                             |
| `crons.ts`                       | Daily cron job (safety net)                                                                   |
| `lib/openAiBatch.ts`             | OpenAI API helpers (upload, create batch, download results)                                   |
| `lib/batchResponseProcessing.ts` | Process AI responses, extract data from crawl results                                         |

### Batch Job States

| Status       | Description                                             |
| ------------ | ------------------------------------------------------- |
| `processing` | Batch submitted to OpenAI, workflow waiting for webhook |
| `completed`  | Batch finished successfully, results processed          |
| `failed`     | Batch failed (OpenAI error or processing error)         |

### Why batchJobs Table Exists

The `@convex-dev/workflow` component handles durable execution, retries, and event waiting. So why do we also need a `batchJobs` table?

**Webhook Routing**: When OpenAI sends a webhook, it only includes its own batch ID:

```json
{ "type": "batch.completed", "data": { "id": "batch_abc123" } }
```

The workflow component doesn't provide a way to query "find the workflow waiting for batch X". The `batchJobs` table provides this lookup:

```
OpenAI batchId  →  workflowId  →  send event to resume workflow
```

**Division of Responsibility**:

| Concern                      | Workflow Component | batchJobs Table                  |
| ---------------------------- | ------------------ | -------------------------------- |
| Durable execution & retries  | Yes                | -                                |
| Event waiting (awaitEvent)   | Yes                | -                                |
| batchId → workflowId mapping | No                 | Yes                              |
| Prevent duplicate workflows  | No                 | Yes (check `status: processing`) |
| Success/error counts         | No                 | Yes                              |
| Historical audit log         | No (cleaned up)    | Yes                              |

In short: the workflow handles _orchestration_, batchJobs handles _routing and observability_.

### Troubleshooting

**Workflow not starting:**

- Check `ENABLE_BATCH_CRON=true` is set
- Check if a batch is already processing: `npx convex run batchJobs:listActive`
- Manually start: `npx convex run batch/manual:manualStartWorkflow`

**Webhook not working:**

- Verify `OPENAI_WEBHOOK_SECRET` is set correctly
- Check webhook URL matches your deployment
- Test webhook from OpenAI dashboard (Settings → Webhooks → Send test event)
- Check Convex logs for webhook errors

**Batch stuck in processing:**

- OpenAI batches can take up to 24 hours
- Check OpenAI dashboard for batch status
- If webhook failed, manually trigger: `npx convex run batch/manual:manualPollBatches`

**Chain stopped unexpectedly:**

- Daily cron will restart it automatically
- Or manually start: `npx convex run batch/manual:manualStartWorkflow`
