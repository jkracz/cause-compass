# Parsley Data Pipeline

Data processing pipeline: IRS imports → web discovery → crawling → AI enrichment → Convex export.

## Commands

```bash
pnpm run start                           # Main entry point
pnpm run create-profiles --state=ca      # Process IRS data for state
pnpm run search-orgs                     # Google search for organizations
pnpm run crawl-sites                     # Crawl websites
pnpm run transform-to-convex             # Export to Convex
```

## Key Components

**Scripts** (`src/scripts/`): `createOrgsByState.ts`, `googleSearchOrgs.ts`, `parseSearchResults.ts`, `transformToConvex.ts`

**Services** (`src/services/`): `mongo.ts`, `crawler.ts`, `googleSearch.ts`, `batchManager.ts`

## URL Scoring Algorithm

Located in `src/utils/parseUtils.ts`:

| Signal               | Points   |
| -------------------- | -------- |
| Exact org name match | +100     |
| Acronym match        | +50      |
| Keyword match        | +20 each |
| `.org` domain        | +20      |

Filters: social media platforms, unwanted subdomains (`blog.*`, `shop.*`, `staging.*`, etc.)
