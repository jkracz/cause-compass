# Parsley Data Pipeline

IRS data import and transformation for Convex.

## Commands

```bash
pnpm run create-profiles-convex --state=ca  # Process IRS data for state → JSONL
pnpm run transform-to-convex                # Transform raw data to Convex format
```

## Key Components

**Scripts** (`src/scripts/`): `createOrgsByStateConvex.ts`, `transformToConvex.ts`

**Services** (`src/services/`): `parseEoFile.ts` (IRS CSV parsing + code dictionary mapping)

**Utils** (`src/utils/`): `convexUtils.ts`, `parseUtils.ts`, `textUtils.ts`, `titleCase.ts`, `fileWrite.ts`, `logger.ts`, `nanoid.ts`

**Data** (`src/data/dataDictionaries/`): IRS code reference data (NTEE, activity codes, etc.)

## URL Scoring Algorithm

Located in `src/utils/parseUtils.ts`:

| Signal               | Points   |
| -------------------- | -------- |
| Exact org name match | +100     |
| Acronym match        | +50      |
| Keyword match        | +20 each |
| `.org` domain        | +20      |

Filters: social media platforms, unwanted subdomains (`blog.*`, `shop.*`, `staging.*`, etc.)
