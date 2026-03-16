# Pipeline Health Query

This document describes the Convex pipeline health query used to inspect ingestion and enrichment flow status.

## Query

- Function: `pipelineHealth:getSummary`
- File: `/Users/joekracz/Documents/projects/cause-compass/cause-compass/packages/backend/convex/pipelineHealth.ts`

## Purpose

`getSummary` provides a single snapshot of:

- organization counts by enrichment stage
- stale/missing `updatedAt` records by stage
- batch job status totals and last success/failure timestamps
- active processing jobs and backlog notes

This is intended as a manual operational check while pipeline automation is being stabilized.

## Run Commands

Default stale threshold (`24` hours):

```bash
npx convex run pipelineHealth:getSummary
```

Custom stale threshold:

```bash
npx convex run pipelineHealth:getSummary '{"staleHours":48}'
```

Run against production deployment:

```bash
npx convex run --prod pipelineHealth:getSummary
```

## Arguments

- `staleHours` (optional number)
  - Minimum age threshold for stale records.
  - The query normalizes this to an integer with a minimum of `1`.

## Response Shape

Top-level fields:

- `generatedAtIso`: ISO timestamp when the snapshot was generated.
- `staleHours`: normalized stale threshold used by the query.
- `cutoffTimestamp`: Unix ms cutoff for stale record checks.
- `organizationTotals`: aggregate totals across all enrichment stages.
- `byStage`: per-stage health metrics for:
  - `created`
  - `searched`
  - `crawled`
  - `ai_confirmed`
  - `ready`
- `batchJobs`: summary of batch job statuses.
- `activeProcessingJobs`: currently processing batch jobs.
- `notes`: quick backlog/status hints.

Per-stage metrics (`byStage.<stage>`):

- `total`: records in that stage.
- `stale`: records with `updatedAt` older than cutoff.
- `missingUpdatedAt`: records without `updatedAt`.
- `staleOrMissing`: `stale + missingUpdatedAt`.
- `fresh`: records newer than cutoff and with `updatedAt`.
- `stalePercent`: percent stale-or-missing in the stage.

Batch metrics (`batchJobs`):

- `processing`: jobs currently processing.
- `completed`: completed jobs.
- `failed`: failed jobs.
- `total`: `processing + completed + failed`.
- `lastSuccessfulBatchAt`: latest completion/creation timestamp among completed jobs.
- `lastFailedBatchAt`: latest completion/creation timestamp among failed jobs.

## How To Interpret

Typical intended stage flow:

`created -> searched -> crawled -> ai_confirmed -> ready`

Common signals:

- High `byStage.created.total`: search and/or crawl automation not keeping up.
- High `byStage.searched.total`: crawler backlog.
- High `byStage.ai_confirmed.total`: finalization step to `ready` is missing or stalled.
- High `stalePercent` in active stages: records are not being refreshed regularly.
- `batchJobs.processing = 0` for long periods: batch workflow may not be running.

## Suggested Manual Check Routine

1. Run `pipelineHealth:getSummary` daily.
2. Record key values:
   - `byStage.created.total`
   - `byStage.searched.total`
   - `byStage.ai_confirmed.total`
   - `byStage.ready.total`
   - `batchJobs.processing/completed/failed`
3. Confirm backlog trends improve over time.
4. Investigate notes and active processing jobs when counts stall.

