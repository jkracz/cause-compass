# Parsley - IRS Data Import Pipeline

Processes IRS Exempt Organizations (EO) data files and transforms them for import into Convex.

## Scripts

```bash
# Process IRS data for a specific state → JSONL output
pnpm run create-profiles-convex -- --state=ca

# Transform raw data exports to Convex-ready JSONL files
pnpm run transform-to-convex

# Validate crawled org websites locally through Ollama
pnpm run local-ai-confirm -- --limit=1000
```

## Local AI Confirmation

`local-ai-confirm` pulls `crawled` organizations from Convex, validates them
sequentially with a local Ollama model, then commits confirmed results back to
Convex. Confirmed positives advance to `ready`; non-ready outcomes advance to
`local_ai_reviewed` so the OpenAI batch workflow can retry them later.

Ollama's local API service must be available, but the selected model does not
need to already be running in memory. The first runner request will cause
Ollama to load the model on demand if it has been pulled locally. Subsequent
requests can reuse that loaded model while Ollama keeps it resident.

Start from `.env.example` in this directory. The runner requires:

- `CONVEX_URL` - target Convex deployment URL
- `LOCAL_AI_OPERATOR_TOKEN` - shared operator token that must match the Convex deployment config

Optional overrides:

- `OLLAMA_MODEL` - defaults to `qwen3.6:35b-a3b-coding-nvfp4`
- `OLLAMA_TIMEOUT_MS` - defaults to `120000`

CLI overrides are also available:

```bash
pnpm run local-ai-confirm -- --limit=100 --model=qwen3.6:35b-a3b-coding-nvfp4 --timeout-ms=180000
```

The runner logs per-EIN failures and keeps processing. Timeouts, invalid model
output, schema validation failures, and failed Convex writes leave the org in
`crawled` for a later retry.

## Components

- **`src/scripts/createOrgsByStateConvex.ts`** - Reads IRS CSV, filters eligible orgs, writes JSONL for `npx convex import`
- **`src/scripts/transformToConvex.ts`** - Transforms raw data exports into Convex table JSONL files
- **`src/scripts/localAiConfirm.ts`** - Runs the sequential local Ollama confirmation workflow against Convex
- **`src/services/parseEoFile.ts`** - Core IRS CSV parser with code dictionary mapping (NTEE, activity, foundation, etc.)
- **`src/data/dataDictionaries/`** - IRS code reference data (10 JSON files)
- **`src/utils/`** - Shared utilities (slug generation, amount bucketing, text processing, logging)

## Data Sources

- [IRS EO File Downloads](https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf#regions)
- [IRS EO Bulk Data Downloads](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads)
- [NTEE Codes](https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes)
- [IRS Activity Codes](https://nccs.urban.org/publication/irs-activity-codes)
- [IRS EO File Documentation](https://www.irs.gov/pub/irs-tege/p4838.pdf)
