# Parsley - IRS Data Import Pipeline

Processes IRS Exempt Organizations (EO) data files and transforms them for import into Convex.

## Scripts

```bash
# Process IRS data for a specific state → JSONL output
pnpm run create-profiles-convex -- --state=ca

# Transform raw data exports to Convex-ready JSONL files
pnpm run transform-to-convex
```

## Components

- **`src/scripts/createOrgsByStateConvex.ts`** - Reads IRS CSV, filters eligible orgs, writes JSONL for `npx convex import`
- **`src/scripts/transformToConvex.ts`** - Transforms raw data exports into Convex table JSONL files
- **`src/services/parseEoFile.ts`** - Core IRS CSV parser with code dictionary mapping (NTEE, activity, foundation, etc.)
- **`src/data/dataDictionaries/`** - IRS code reference data (10 JSON files)
- **`src/utils/`** - Shared utilities (slug generation, amount bucketing, text processing, logging)

## Data Sources

- [IRS EO File Downloads](https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf#regions)
- [IRS EO Bulk Data Downloads](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads)
- [NTEE Codes](https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes)
- [IRS Activity Codes](https://nccs.urban.org/publication/irs-activity-codes)
- [IRS EO File Documentation](https://www.irs.gov/pub/irs-tege/p4838.pdf)
