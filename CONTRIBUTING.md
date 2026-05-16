# Contributing To Cause Compass

Thanks for taking the time to contribute. Cause Compass is a TypeScript monorepo with a public web app, Convex backend, data import pipeline, and crawl workers. This guide explains how to make changes that are easy to review and safe to merge.

## Project Values

Cause Compass is built for calm nonprofit discovery. Product work should help people find and remember organizations that match their values without turning the experience into a donation funnel, charity scorecard, or dense research database.

When adding user-facing features, keep these principles in mind:

- Lead with the cause, not bureaucratic record details.
- Do not imply human curation where the product is using generated, randomized, or imported data.
- Keep the interface quiet, readable, accessible, and useful on mobile.
- Optimize for saving meaningful causes, not trapping users in the app.

Read [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), and [docs/architecture.md](docs/architecture.md) before larger product or frontend changes.

## Development Setup

Install dependencies:

```bash
pnpm install
```

Run all development tasks:

```bash
pnpm dev
```

Run one workspace when you can:

```bash
pnpm --filter web dev
pnpm --filter @cause/backend dev
pnpm --filter @cause/scraper build
```

Copy the relevant `.env.example` file before running an app locally:

- `apps/web/.env.example`
- `apps/parsley/.env.example`
- `apps/scraper/.env.example`

Some workflows require external credentials or a configured Convex deployment. It is fine to contribute isolated frontend, type, docs, or parser improvements without running the entire production pipeline.

If you need sample data or access to a shared Cause Compass Convex instance for a larger contribution, email `support@causecompass.org` with a short note about what you are working on.

## Repository Layout

| Path               | Use                                  |
| ------------------ | ------------------------------------ |
| `apps/web`         | Next.js frontend                     |
| `apps/parsley`     | IRS data parsing and import scripts  |
| `apps/scraper`     | Crawl workers                        |
| `packages/backend` | Convex backend                       |
| `packages/lib`     | Shared schemas, types, and utilities |
| `docs`             | Architecture and operations notes    |

Each package may have its own README with more specific commands.

## Making Changes

1. Create a focused branch from `main`.
2. Keep pull requests scoped to one concern.
3. Prefer existing patterns in the package you are editing.
4. Add or update documentation when behavior, setup, or commands change.
5. Do not commit secrets, generated local state, `.env` files, `.next`, `node_modules`, or local data dumps.

For shared types, update `packages/lib` first and then adjust downstream packages. For Convex schema changes, think through migration and backfill paths before narrowing validation.

## Code Style

- Use TypeScript.
- Keep Zod schemas and inferred types close together where the shared library already does that.
- Use workspace packages instead of duplicating types across apps.
- Keep frontend components accessible with keyboard support, visible focus states, semantic HTML, and reduced-motion handling where animation is involved.
- Avoid broad refactors in feature PRs unless the refactor is required for the change.

Run formatting when needed:

```bash
pnpm format
```

## Validation

Before opening a pull request, run the root checks:

```bash
pnpm typecheck
pnpm lint
```

For narrower changes, package-local checks are useful while iterating:

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter @cause/backend typecheck
pnpm --filter @cause/backend lint
pnpm --filter @cause/scraper typecheck
pnpm --filter @cause/scraper lint
pnpm --filter @cause/lib build
```

If you cannot run a check because you do not have required credentials or local infrastructure, mention that in the pull request.

## Pull Requests

A good pull request includes:

- A short description of the problem and solution.
- Screenshots or recordings for visible frontend changes.
- Notes about data migrations, Convex deploy steps, or environment variables when relevant.
- The validation commands you ran.

Keep PRs reviewable. If a change touches frontend, backend, and data pipeline behavior at once, explain the order in which reviewers should read it.

## Data And Crawling

Be careful with data pipeline and crawler changes:

- Respect nonprofit websites and avoid increasing crawl pressure casually.
- Keep crawl fallback rules explicit and auditable.
- Preserve queue recovery behavior when changing worker flow.
- Treat imported IRS data as source data and transformed Convex records as application data.
- Do not commit large raw data files unless the project explicitly adds them as fixtures.

Use small samples or fixtures for tests and examples whenever possible.

## Security

Do not open an issue with private credentials, tokens, webhook secrets, or sensitive deployment details. If you find a security issue, report it privately to the maintainers rather than disclosing it in a public issue.

At minimum, check that any new endpoint:

- Authenticates callers when it mutates data or exposes non-public state.
- Does not trust client-provided user identity.
- Validates input with existing Convex validators or shared schemas.
- Avoids logging secrets or private tokens.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
