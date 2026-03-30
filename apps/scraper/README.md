# Cause Compass Scraper Workers

`apps/scraper` runs the crawl workers for Cause Compass.

Workers:

- `html-worker`: low-cost HTTP fetch + Cheerio extraction
- `browser-worker`: Playwright render + the same extraction pipeline

Queue state and orchestration are in Convex. The workers run outside Convex: directly on your machine for development, or in Docker for always-on deployment.

## What It Does

- Claims jobs from Convex `crawlQueue`
- Crawls URLs and extracts normalized fields
- Writes results to Convex `crawlResults`
- Uses explicit HTML -> browser fallback rules
- Retries and recovers stuck jobs through queue status + cron recovery

## End-to-End Flow

1. Search/backfill enqueue `queueType="html"` jobs.
2. `html-worker` claims and fetches raw HTML.
3. If HTML is usable, extraction completes in HTML lane.
4. If fallback is required (low text, JS shell, 403/429, Cloudflare challenge), job is escalated to `queueType="browser"`.
5. `browser-worker` renders with Playwright, extracts, and completes.

Convex worker routes:

- `POST /worker/claim`
- `POST /worker/complete`
- `POST /worker/fail`
- `POST /worker/enqueue`

## Why No Crawlee

- Queue semantics are owned in Convex, not in crawler framework internals.
- Fallback decisions are explicit and easy to audit.
- Local machine debugging is simple, and Docker deployment on TrueNAS stays straightforward (two long-lived worker processes).

## Extractors

Both workers feed HTML into the same extraction entry point:

- `extractAll(html, sourceUrl)` in `src/extractors/index.ts`

That keeps output shape identical across HTML and browser paths.

Extractor modules:

- `text.ts`
- `social.ts`
- `donation.ts`
- `logo.ts`
- `email.ts`
- `newsletter.ts`
- `about.ts`

## Security

Auth method: pre-shared Bearer token (static token auth).

- Header: `Authorization: Bearer <WORKER_TOKEN>`
- Verified by Convex HTTP worker routes

Generate token:

```bash
openssl rand -hex 32
```

Set the same value in:

- Convex env var: `WORKER_TOKEN`
- worker env: `apps/scraper/.env` -> `WORKER_TOKEN=...`

## Cron Jobs vs Workers

Workers continuously poll and process queue items.
Crons populate/recover queue state.

- `search-organizations` (daily): creates new candidates
- `recover-stale-crawl-jobs` (every 5 min): resets stuck `processing` items
- `backfill-crawl-queue` (every 30 min): catches missed enqueues

Crawl crons run only when:

- `ENABLE_CRAWL_CRON=true`

Search cron remains separately gated by:

- `ENABLE_SEARCH_CRON=true`

## Prerequisites

- Convex deployment with `/worker/*` HTTP routes deployed
- Convex env `WORKER_TOKEN` set
- `CONVEX_SITE_URL` must be the `.convex.site` URL (including `.site`)
- Node + pnpm installed locally for machine-native runs
- Docker runtime for production workers (recommended)

## Environment Variables

Template: `apps/scraper/.env.example`

Required:

- `CONVEX_SITE_URL`
- `WORKER_TOKEN`

Common:

- `WORKER_ID`
- `CONCURRENCY`
- `POLL_INTERVAL_MS`
- `DOMAIN_THROTTLE_MS`
- `WORKER_HEALTH_FILE`
- `HEALTH_UPDATE_MS`
- `HEALTH_MAX_AGE_MS`

Browser:

- `BROWSER_HEADLESS`
- `BROWSER_NAV_TIMEOUT_MS`
- `BROWSER_WAIT_AFTER_LOAD_MS`

## Run On Your Machine (Recommended For Development)

This is the default local workflow. It avoids Docker while you are iterating and keeps startup simple.

From repo root:

```bash
cp apps/scraper/.env.example apps/scraper/.env
# edit apps/scraper/.env with CONVEX_SITE_URL + WORKER_TOKEN

pnpm install
pnpm --filter @cause/scraper run typecheck
pnpm --filter @cause/scraper run build

# one-time Playwright browser install for the browser worker
pnpm --filter @cause/scraper exec playwright install chromium
```

Start the HTML worker:

```bash
node --env-file=apps/scraper/.env apps/scraper/dist/html-worker.js
```

Start the browser worker in a second terminal when you want JS-rendered fallbacks:

```bash
node --env-file=apps/scraper/.env apps/scraper/dist/browser-worker.js
```

Notes:

- Running only `html-worker` is often enough to validate the pipeline locally.
- Start `browser-worker` when you want to process HTML fallbacks or debug Playwright behavior.
- For headed browser debugging, set `BROWSER_HEADLESS=false` in `apps/scraper/.env`.
- If you change scraper code, rerun `pnpm --filter @cause/scraper run build` before restarting the worker.

## Run Locally With Docker Compose (Alternative)

Use this if you want your local environment to match the deployment model more closely.
For production TrueNAS deployment, prefer registry images (see TrueNAS section).

From repo root:

```bash
cp apps/scraper/.env.example apps/scraper/.env
# edit apps/scraper/.env with CONVEX_SITE_URL + WORKER_TOKEN

docker compose -f apps/scraper/docker-compose.yml up -d --build
docker compose -f apps/scraper/docker-compose.yml logs -f html-worker browser-worker
```

Stop:

```bash
docker compose -f apps/scraper/docker-compose.yml down
```

## Build, Tag, and Push Images (Registry)

Use one naming convention in production:

- `<dockerhub_user>/cause-scraper-html:<version>`
- `<dockerhub_user>/cause-scraper-browser:<version>`

Use the same `<version>` for both images in one release (example: `v2026.03.06`).
This keeps TrueNAS config obvious: one image for HTML worker, one image for browser worker, same release tag.

You can use one repo name with different tags (for example `...:html-v2026.03.06` and `...:browser-v2026.03.06`), but two explicit image names are less error-prone in TrueNAS UI.

From repo root:

```bash
USER=<dockerhub_user>
VERSION=v2026.03.06

docker login -u "$USER"

docker build -f apps/scraper/Dockerfile \
  -t "$USER/cause-scraper-html:$VERSION" .
docker build -f apps/scraper/Dockerfile.browser \
  -t "$USER/cause-scraper-browser:$VERSION" .

docker push "$USER/cause-scraper-html:$VERSION"
docker push "$USER/cause-scraper-browser:$VERSION"
```

Optional convenience tags:

```bash
docker tag "$USER/cause-scraper-html:$VERSION" "$USER/cause-scraper-html:latest"
docker tag "$USER/cause-scraper-browser:$VERSION" "$USER/cause-scraper-browser:latest"
docker push "$USER/cause-scraper-html:latest"
docker push "$USER/cause-scraper-browser:latest"
```

Avoid deploying `latest` in TrueNAS. Deploy the immutable version tag.

If you are building on Apple Silicon for an amd64 NAS, use `buildx`:

```bash
docker buildx build --platform linux/amd64 -f apps/scraper/Dockerfile \
  -t "$USER/cause-scraper-html:$VERSION" --push .
docker buildx build --platform linux/amd64 -f apps/scraper/Dockerfile.browser \
  -t "$USER/cause-scraper-browser:$VERSION" --push .
```

## Run With Docker (No Compose)

This is for local testing only. For TrueNAS, prefer registry images in Apps UI.

Build local images from repo root:

```bash
docker build -f apps/scraper/Dockerfile -t cause-scraper-html:local .
docker build -f apps/scraper/Dockerfile.browser -t cause-scraper-browser:local .
```

Run HTML worker:

```bash
docker run -d \
  --name cause-html-worker \
  --restart always \
  --env-file apps/scraper/.env \
  -e WORKER_ID=html-worker-1 \
  -e CONCURRENCY=20 \
  cause-scraper-html:local \
  node dist/html-worker.js
```

Run browser worker:

```bash
docker run -d \
  --name cause-browser-worker \
  --restart always \
  --env-file apps/scraper/.env \
  -e WORKER_ID=browser-worker-1 \
  -e CONCURRENCY=2 \
  cause-scraper-browser:local \
  node dist/browser-worker.js
```

## TrueNAS SCALE Deployment (Recommended)

Default recommendation: use **TrueNAS Apps UI** with **registry images**.

Do not rely on building from repo source on the NAS as the primary deployment path.
Use host-shell `docker compose` from source only as a fallback.

Recommended runtime model in either case: always-on worker containers with restart policy `always`.

1. Build and push images to a registry using the naming convention in "Build, Tag, and Push Images (Registry)".
2. In TrueNAS Apps UI, deploy a Custom App via Docker Compose YAML:
   - Apps -> Discover Apps -> Custom App
   - choose Docker Compose
   - define two services using `image:` (not `build:`):
     - `html-worker` command: `node dist/html-worker.js`
     - `browser-worker` command: `node dist/browser-worker.js`
3. Set environment variables for both services:
   - required: `CONVEX_SITE_URL`, `WORKER_TOKEN`
   - recommended shared: `POLL_INTERVAL_MS`, `DOMAIN_THROTTLE_MS`, `HEALTH_UPDATE_MS`, `HEALTH_MAX_AGE_MS`
   - HTML-specific: `WORKER_ID=html-worker-1`, `CONCURRENCY=20`, `WORKER_HEALTH_FILE=/tmp/html-worker.health.json`
   - browser-specific: `WORKER_ID=browser-worker-1`, `CONCURRENCY=2`, `WORKER_HEALTH_FILE=/tmp/browser-worker.health.json`
4. Set restart policy to always and set resource limits:
   - HTML worker: 1 CPU, 2 GB RAM
   - browser worker: 4 CPU, 8 GB RAM
5. Start app and confirm both containers are healthy.
6. Check logs:
   - ensure periodic polling
   - ensure no recurring 401/404 from `/worker/*`
7. Update process:
   - build and push new version tag for both images
   - change both image tags in TrueNAS app config
   - redeploy

Fallback: build from source on TrueNAS only if needed.

If you must build from source and Apps UI cannot resolve `../../` build context, use one of these:

- run compose directly via shell from repo root:
  - `docker compose -f apps/scraper/docker-compose.yml up -d --build`
- or copy compose file to repo root and adjust build contexts to `.`

Resource baseline for 32 GB host:

- HTML worker: 1 CPU / 2 GB / `CONCURRENCY=20`
- Browser worker: 4 CPU / 8 GB / `CONCURRENCY=2`

Tune using queue depth, fallback rate, and memory pressure.

## Validation Checklist

1. Auth route responds:

```bash
curl -i -X POST "$CONVEX_SITE_URL/worker/claim" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"queueType":"html","workerId":"smoke"}'
```

`200` with `null` means route/auth are correct and queue is empty.

2. Manual enqueue:

```bash
curl -X POST "$CONVEX_SITE_URL/worker/enqueue" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"queueType":"html","orgId":"<ORG_ID>","ein":"<EIN>","url":"https://example.org"}'
```

3. Watch logs for `claim -> process -> complete` (or HTML -> browser escalation).

## Operations

- Workers are long-lived pollers; idle queue means they keep polling.
- Backfill cron should enqueue historical search results not yet in `crawlQueue`.
- Healthcheck uses `dist/healthcheck.js` heartbeat freshness.
- Graceful shutdown handles `SIGTERM`/`SIGINT` and drains in-flight jobs.

## Troubleshooting

- `404` on `/worker/claim`:
  - wrong `CONVEX_SITE_URL` (often missing `.convex.site` or wrong deployment)
  - worker routes not deployed to that deployment
- `401` on `/worker/*`:
  - token mismatch between Convex env and worker `.env`
- Queue stays empty:
  - no pending items yet; run search/backfill or manual enqueue
- local browser worker fails with `Executable doesn't exist`:
  - run `pnpm --filter @cause/scraper exec playwright install chromium`
- Browser container restarts:
  - verify using `Dockerfile.browser` image and sufficient memory
