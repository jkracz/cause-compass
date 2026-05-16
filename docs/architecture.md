# Architecture

## Data Flow

1. **IRS Import** (parsley): CSV files -> filtered organizations -> Convex (`npx convex import`)
2. **Web Discovery** (backend): Convex cron + Google Search API finds candidate organization websites and enqueues crawl jobs
3. **Crawling** (scraper): Docker or local workers process the Convex crawl queue with an HTML-first lane and Playwright fallback
4. **AI Confirmation / Enrichment** (backend + parsley): OpenAI batch processing and optional local/Claude/Codex runners validate websites and write profile fields
5. **Frontend** (web): users browse, search, save, and open enriched organization profiles

## Convex Backend

The backend uses Convex as the control plane for search, crawl, enrichment, users, and analytics-facing queries. OpenAI batch enrichment uses `@convex-dev/workflow` for durable processing:

- Workflows wait for OpenAI webhooks via `awaitEvent`
- The `batchJobs` table maps OpenAI batch IDs to workflow IDs for webhook routing
- Daily cron acts as a safety net to restart stalled workflows

The crawl pipeline uses Convex tables and HTTP worker routes:

- `crawlQueue` stores pending, processing, completed, and failed crawl jobs
- external workers claim and complete jobs through `/worker/*` routes
- scheduled recovery resets stale processing jobs
- scheduled backfill enqueues searched organizations that do not yet have active crawl jobs

## Shared Types

The `@cause/lib` package exports shared Zod schemas, TypeScript types, and text utilities consumed mainly by parsley and the Convex backend, with selected utilities used by web:

- Organization schemas with NTEE codes, financial buckets
- Search result schemas
- AI confirmation and worker payload schemas
