# Architecture

## Data Flow

1. **IRS Import** (parsley): CSV files → filtered organizations → Convex (`npx convex import`)
2. **Web Discovery** (backend): Convex cron + Google Search API finds organization websites
3. **Crawling** (scraper): Docker workers (HTML-first + Playwright fallback) extract website content via Convex crawl queue
4. **AI Enrichment** (backend): OpenAI batch processing generates mission statements
5. **Frontend** (web): Users browse and filter enriched organization profiles

## Convex Backend

The backend uses `@convex-dev/workflow` for durable batch processing:

- Workflows wait for OpenAI webhooks via `awaitEvent`
- The `batchJobs` table maps OpenAI batch IDs to workflow IDs for webhook routing
- Daily cron acts as a safety net to restart stalled workflows

## Shared Types

The `@cause/types` package exports Zod schemas consumed by both web and parsley:

- Organization schemas with NTEE codes, financial buckets
- User preference schemas
- Search result schemas
