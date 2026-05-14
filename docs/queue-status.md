# Queue Status Query

This document describes the Convex crawl queue status query used for worker monitoring.

## Query

- Function: internal query `crawlQueue:getQueueStats`
- File: `packages/backend/convex/crawlQueue.ts`

## Purpose

`getQueueStats` returns queue depth totals for one crawl worker type. It is an internal query, so it is primarily called by backend actions and maintenance code rather than directly from the web client.

Arguments:

- `queueType`: `"html"` or `"browser"`

It returns counts for:

- pending
- processing
- completed
- failed

Counts are backed by the `@convex-dev/aggregate` component, which keeps a
separate aggregate namespace for each `queueType + status` pair. This avoids
the read-limit failures caused by scanning large `crawlQueue` partitions.

## Setup

### Aggregate backfill

After deploying the aggregate-backed query to an environment with existing
`crawlQueue` history, run the backfill once:

```bash
npx convex run crawlQueue:backfillQueueStatsAggregate '{"cursor": null}'
```

This self-schedules through the full table in pages of 100.

### Keeping the aggregate in sync

All `crawlQueue` writes must go through the helpers in
`packages/backend/convex/aggregates.ts`:

- `insertCrawlQueueJob`
- `patchCrawlQueueJob`

Those helpers keep the aggregate synchronized for enqueue, claim, completion,
failure, and stale-job recovery paths.
