# Cause Compass

Cause Compass helps people discover nonprofit organizations that match their values, save the ones that resonate, and build a personal collection of causes to revisit.

The project is not a charity rating service, donation checkout, or Form 990 research tool. It is an open source discovery product for turning nonprofit data into a calmer browsing experience: IRS records become searchable organizations, crawler output becomes useful profiles, and the web app helps users find causes they may not have known to search for.

## What Is In This Repo

This is a pnpm and Turborepo monorepo.

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js 16 App Router frontend for browsing, saving, and reading nonprofit profiles |
| `apps/parsley` | IRS Exempt Organizations data parsing, Convex import preparation, and optional AI confirmation runners |
| `apps/scraper` | HTML and Playwright crawl workers that process the Convex crawl queue |
| `packages/backend` | Convex backend: schema, queries, mutations, auth, crons, worker routes, and enrichment workflows |
| `packages/lib` | Shared Zod schemas, TypeScript types, and utilities |
| `packages/eslint-config` | Shared ESLint configuration |
| `packages/typescript-config` | Shared TypeScript configuration |
| `docs` | Architecture and pipeline notes |

## Architecture

The platform has five main stages:

1. IRS import: `apps/parsley` parses IRS EO data into Convex-ready organization records.
2. Web discovery: Convex cron jobs and Google Search API integrations find candidate websites for organizations.
3. Crawling: `apps/scraper` workers claim crawl jobs from Convex, try a low-cost HTML fetch first, and fall back to Playwright for JavaScript-heavy sites.
4. Confirmation and enrichment: Convex workflows and optional local runners validate websites and write profile fields such as mission, summary, donation URL, social links, logo, emails, activities, and keywords.
5. Frontend: `apps/web` reads from Convex so users can browse, search, save, and open organization profiles.

Read [docs/architecture.md](docs/architecture.md) for more detail.

## Tech Stack

- TypeScript
- pnpm 11
- Turborepo
- Next.js 16, React 19, Tailwind CSS 4
- Convex
- Better Auth
- PostHog
- OpenAI Batch API
- Playwright and Cheerio
- Zod

## Getting Started

Prerequisites:

- Node.js compatible with the package versions in this repo
- pnpm 11.1.1 or newer
- A Convex deployment for backend or full-stack work
- Optional service credentials for Google OAuth, Google Search API, OpenAI, PostHog, Anthropic, Codex SDK, or Ollama depending on the workflow you are developing

Install dependencies from the repository root:

```bash
pnpm install
```

Run the full development workspace:

```bash
pnpm dev
```

For most frontend work, run only the web app:

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web dev
```

The web app expects public Convex configuration in `apps/web/.env.local`. A local browser origin must match the backend `SITE_URL` value, usually `http://localhost:3000`.

## Common Commands

Run these from the repository root:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```

Run commands in one workspace with pnpm filters:

```bash
pnpm --filter web lint
pnpm --filter @cause/backend typecheck
pnpm --filter @cause/scraper build
pnpm --filter @cause/lib build
```

## Environment Configuration

Environment examples live next to the apps that use them:

- `apps/web/.env.example` for public frontend configuration
- `apps/parsley/.env.example` for data and AI confirmation runners
- `apps/scraper/.env.example` for crawl workers
- Convex backend variables are configured in the Convex dashboard or local Convex environment

Important backend variables include:

- `BETTER_AUTH_SECRET`
- `SITE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_WEBHOOK_SECRET`
- `WORKER_TOKEN`
- `ENABLE_BATCH_CRON`
- `ENABLE_SEARCH_CRON`
- `ENABLE_CRAWL_CRON`
- `ENABLE_CRAWL_BACKFILL_CRON`

Never commit real secrets. Use the example files as templates only.

## Working With The Main Packages

### Web

```bash
pnpm --filter web dev
pnpm --filter web lint
pnpm --filter web typecheck
```

See [apps/web/README.md](apps/web/README.md).

### Convex Backend

```bash
pnpm --filter @cause/backend dev
pnpm --filter @cause/backend lint
pnpm --filter @cause/backend typecheck
```

Detailed backend notes are in [packages/backend/convex/README.md](packages/backend/convex/README.md).

### IRS Data Pipeline

```bash
pnpm --filter np-data-parser run create-profiles-convex -- --state=ca
pnpm --filter np-data-parser run transform-to-convex
pnpm --filter np-data-parser run local-ai-confirm -- --limit=100
```

See [apps/parsley/README.md](apps/parsley/README.md).

### Scraper Workers

```bash
cp apps/scraper/.env.example apps/scraper/.env
pnpm --filter @cause/scraper build
pnpm --filter @cause/scraper run html-worker
pnpm --filter @cause/scraper run browser-worker
```

See [apps/scraper/README.md](apps/scraper/README.md) for Docker and deployment details.

## Data Sources

Cause Compass uses public nonprofit data and crawled organization websites. Primary references include:

- IRS Exempt Organizations Business Master File extracts
- IRS Tax Exempt Organization Search bulk data
- National Taxonomy of Exempt Entities codes
- IRS activity and filing code documentation

See the Parsley README for source links and import notes.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), then read the package README for the area you want to change.

Before opening a pull request, run:

```bash
pnpm typecheck
pnpm lint
```

## License

Cause Compass is licensed under the Apache License 2.0. See [LICENSE](LICENSE).
