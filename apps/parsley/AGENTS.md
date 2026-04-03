# Parsley Data Pipeline

This package handles IRS nonprofit data import and transformation for Convex.

## Commands

```bash
pnpm run create-profiles-convex --state=ca
pnpm run transform-to-convex
pnpm typecheck
pnpm lint
```

## Key Areas

- `src/scripts/` - entry points such as `createOrgsByStateConvex.ts` and `transformToConvex.ts`
- `src/services/` - parsing services such as `parseEoFile.ts`
- `src/utils/` - Convex helpers, text parsing, file writing, logging, and ID generation
- `src/data/dataDictionaries/` - IRS reference data including NTEE and activity code dictionaries

If a change affects Convex payload shape or import expectations, read [packages/backend/AGENTS.md](../../packages/backend/AGENTS.md) too.

## URL Scoring

The URL scoring logic lives in `src/utils/parseUtils.ts`.

- Exact organization name match: `+100`
- Acronym match: `+50`
- Keyword match: `+20` each
- `.org` domain: `+20`

The parser also filters common social platforms and unwanted subdomains such as `blog.*`, `shop.*`, and `staging.*`.
