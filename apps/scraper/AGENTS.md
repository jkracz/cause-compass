# Scraper App

This package runs the Cause Compass crawl workers outside Convex.

## Commands

```bash
pnpm run html-worker
pnpm run browser-worker
pnpm build
pnpm typecheck
pnpm lint
```

For workspace-filtered commands, use:

```bash
pnpm --filter @cause/scraper run build
pnpm --filter @cause/scraper run typecheck
pnpm --filter @cause/scraper run lint
```

## Runtime Model

- `src/html-worker.ts` handles low-cost HTTP fetch and extraction
- `src/browser-worker.ts` handles Playwright-based rendering and extraction
- Both workers claim jobs from Convex and write results back through `/worker/*` HTTP routes
- Shared extraction logic lives in `src/extractors/`
- Browser fallback detection lives in `src/fallback.ts`
- Worker health state is written by `src/health.ts`

If a change affects queue semantics, worker payloads, or Convex endpoints, read [packages/backend/AGENTS.md](../../packages/backend/AGENTS.md) too.

## Environment

- Local worker env file: `apps/scraper/.env`
- Example env file: `apps/scraper/.env.example`
- Important variables include `CONVEX_SITE_URL`, `WORKER_TOKEN`, `WORKER_ID`, and `WORKER_HEALTH_FILE`

Do not commit real secrets from `.env`.

## Docker

- `Dockerfile` builds the HTML worker image
- `Dockerfile.browser` builds the browser worker image
- `docker-compose.yml` runs both workers together for local or server deployment

The package README contains the detailed local, Docker, and deployment workflows: [README.md](README.md).
