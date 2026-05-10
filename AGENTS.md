# Cause Compass

Cause Compass is a platform that helps users discover nonprofit organizations that match their values.

## Workspace

- Monorepo managed with `pnpm` and Turborepo
- `apps/web` - Next.js 16 frontend
- `apps/parsley` - data processing and import pipeline
- `apps/scraper` - HTML and browser scraping workers
- `packages/backend` - Convex backend
- `packages/lib` - shared Zod schemas and types

When working inside a package or app, read the nearest `AGENTS.md` in that directory as well as this root file.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

After changes, always run `pnpm typecheck` and `pnpm lint` to ensure the code is correct.
Run package-local commands from the relevant workspace when you only need to validate one area.
