# Convex Backend

This directory contains the Convex backend functions for Cause Compass.

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
npx convex run openAiBatch:manualStartWorkflow

# Start with a custom limit
npx convex run openAiBatch:manualStartWorkflow '{"limit": 5}'

# Check batch job status
npx convex run batchJobs:listAll

# Manually create a batch (without workflow)
npx convex run openAiBatch:manualCreateBatch '{"limit": 5}'

# Manually process results (if needed)
npx convex run openAiBatch:manualProcessResults '{"jobId": "..."}'
```

### Files

| File | Description |
|------|-------------|
| `openAiBatch.ts` | Workflow definition, actions for batch processing, webhook handler |
| `batchJobs.ts` | CRUD operations for the `batchJobs` table |
| `http.ts` | HTTP endpoint for OpenAI webhooks |
| `crons.ts` | Daily cron job (safety net) |
| `lib/openAiBatch.ts` | OpenAI API helpers (upload, create batch, download results) |
| `lib/batchResponseProcessing.ts` | Process AI responses, extract data from crawl results |

### Batch Job States

| Status | Description |
|--------|-------------|
| `processing` | Batch submitted to OpenAI, workflow waiting for webhook |
| `completed` | Batch finished successfully, results processed |
| `failed` | Batch failed (OpenAI error or processing error) |

### Troubleshooting

**Workflow not starting:**
- Check `ENABLE_BATCH_CRON=true` is set
- Check if a batch is already processing: `npx convex run batchJobs:listActive`
- Manually start: `npx convex run openAiBatch:manualStartWorkflow`

**Webhook not working:**
- Verify `OPENAI_WEBHOOK_SECRET` is set correctly
- Check webhook URL matches your deployment
- Test webhook from OpenAI dashboard (Settings → Webhooks → Send test event)
- Check Convex logs for webhook errors

**Batch stuck in processing:**
- OpenAI batches can take up to 24 hours
- Check OpenAI dashboard for batch status
- If webhook failed, manually trigger: `npx convex run openAiBatch:manualPollBatches`

**Chain stopped unexpectedly:**
- Daily cron will restart it automatically
- Or manually start: `npx convex run openAiBatch:manualStartWorkflow`
