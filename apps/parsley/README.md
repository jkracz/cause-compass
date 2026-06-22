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

# Validate crawled org websites via Claude (subscription or API key)
pnpm run claude-ai-confirm -- --limit=1000

# Validate crawled org websites via Codex (login session or API key)
pnpm run codex-ai-confirm -- --limit=1000

# Research created orgs with live Codex web search (dry-run JSONL by default)
pnpm run codex-ai-research -- --limit=25

# Research created orgs with live Claude web search (dry-run JSONL by default)
pnpm run claude-ai-research -- --limit=25
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

## Claude AI Confirmation

`claude-ai-confirm` is a sibling runner that uses the Claude Agent SDK instead
of Ollama. It shares the same Convex pipeline and schema, but treats Claude as
a trusted frontier model: confirmed websites advance to `ready` as usual, and
non-confirmed results advance to `ai_confirmed` (skipping the OpenAI re-review
loop). The Ollama runner, by contrast, sends non-confirmed results to
`local_ai_reviewed` so the OpenAI batch can retry them. The SDK call is
single-turn with no tools — same shape as the Ollama path.

Authentication is auto-detected at startup, in this order:

1. `ANTHROPIC_API_KEY` env var → metered API billing.
2. A local Claude login session under `~/.claude` → Max subscription quota.
   On macOS, the token material may live in Keychain rather than a credentials
   JSON file, so the runner only checks that the Claude config directory exists.

If neither credential source is available, the runner exits immediately with a
helpful message before any Convex traffic.

Required env vars (same as the Ollama runner):

- `CONVEX_URL` - target Convex deployment URL
- `LOCAL_AI_OPERATOR_TOKEN` - shared operator token that must match the Convex deployment config

Optional overrides:

- `ANTHROPIC_API_KEY` - omit to use the `claude login` subscription session
- `ANTHROPIC_MODEL` - defaults to `claude-sonnet-4-6`
- `ANTHROPIC_TIMEOUT_MS` - defaults to `120000`
- `ANTHROPIC_CONCURRENCY` - number of candidates processed in parallel; defaults to `5`

CLI overrides are also available:

```bash
pnpm run claude-ai-confirm -- --limit=100 --model=claude-sonnet-4-6 --timeout-ms=180000 --concurrency=20
```

Per-request calls are network-bound (~25-30s each on subscription auth), so
parallelism is the main throughput lever. Start at the default `5` and dial up
if you have headroom — watch for `429`/`overloaded` errors in the log as a
sign you've hit a rate or quota ceiling.

Error semantics mirror the Ollama runner: per-EIN failures are logged and the
loop continues; timeouts, malformed model output, schema failures, and failed
Convex writes leave the org in `crawled` for a later retry.

Note: the SDK's native `outputFormat: json_schema` mode (constrained generation

- automatic schema-mismatch retries) is only active on the `ANTHROPIC_API_KEY`
  auth path. The Max subscription path silently ignores `outputFormat` and
  returns free-form text; the runner parses and validates that text as a
  fallback. Use API-key auth for higher reliability on noisy crawl data.

## Codex AI Confirmation

`codex-ai-confirm` is another trusted frontier-model runner, using the OpenAI
Codex SDK. It shares the same Convex pipeline and schema as the Claude runner:
confirmed websites advance to `ready`, and non-confirmed results advance to
`ai_confirmed` instead of `local_ai_reviewed`. The Codex turn is configured as
read-only with no approvals and no web search/network access; it should answer
from the supplied crawl text only.

Authentication is handled by the Codex SDK. Set `CODEX_API_KEY` or
`OPENAI_API_KEY` for API billing, or leave both unset to use the local Codex
login session.

Required env vars (same as the other AI runners):

- `CONVEX_URL` - target Convex deployment URL
- `LOCAL_AI_OPERATOR_TOKEN` - shared operator token that must match the Convex deployment config

Optional overrides:

- `CODEX_API_KEY` - optional API key for metered billing
- `CODEX_MODEL` - defaults to `gpt-5.4-mini`
- `CODEX_TIMEOUT_MS` - defaults to `120000`
- `CODEX_CONCURRENCY` - number of candidates processed in parallel; defaults to `5`

CLI overrides are also available:

```bash
pnpm run codex-ai-confirm -- --limit=100 --model=gpt-5.4-mini --timeout-ms=180000 --concurrency=5
```

The runner requests structured output through `outputSchema`, then parses and
validates `finalResponse` with the shared Zod schema before committing. Per-EIN
failures are logged and the loop continues.

## Codex AI Research

`codex-ai-research` is a live-search Codex worker for `created` organizations
that do not already have search or Codex research artifacts. It asks Codex to
resolve the official website, gather profile fields with field-level evidence,
extract links, and return crawl candidates in one structured response.

The default mode is dry-run. It does not mutate Convex; it writes one JSONL line
per organization to `.context/codex-ai-research-sample.jsonl` for manual review:

```bash
pnpm run codex-ai-research -- --limit=25 --concurrency=3 --timeout-ms=180000
```

Write modes are explicit:

- `--enqueue-crawl` also enqueues high/medium crawl candidates and advances the
  organization to `searched` when crawl jobs are created, otherwise
  `ai_confirmed`.
- `--promote-ready` promotes high-confidence results with a correct website,
  at least two identity evidence items, and a mission or one-sentence summary.
  It also promotes medium-confidence results when they have at least three
  identity evidence items, an official-site candidate for the confirmed domain,
  and hard identity evidence such as EIN, street address, or name plus
  city/state. Non-promoted results follow the enqueue/fallback path.

The runner uses the same Codex auth sources as `codex-ai-confirm`: set
`CODEX_API_KEY` or `OPENAI_API_KEY` for API billing, or leave both unset to use
the local Codex login session. It also requires `CONVEX_URL` and
`LOCAL_AI_OPERATOR_TOKEN` to list candidates and to use commit modes.

Optional environment overrides:

- `CODEX_RESEARCH_MODEL` - defaults to `CODEX_MODEL` or `gpt-5.4-mini`
- `CODEX_RESEARCH_TIMEOUT_MS` - defaults to `180000`
- `CODEX_RESEARCH_CONCURRENCY` - defaults to `3`

## Claude AI Research

`claude-ai-research` is the Claude Agent SDK counterpart to `codex-ai-research`.
It does the exact same job for `created` organizations that do not already have
search or research artifacts: resolve the official website, gather profile
fields with field-level evidence, extract links, and return crawl candidates in
one structured response. It shares the same Convex backend, `researchRuns`
table, and projection logic as the Codex runner — each run is tagged with
`agent: "claude"` for provenance.

Codex's `webSearchMode: "live"` is replaced by the Agent SDK's built-in
`WebSearch` and `WebFetch` tools in a multi-turn agentic loop. The turn is
read-only: only the web tools are available (no filesystem or bash access),
permissions are bypassed, and no project/user settings are loaded.

The default mode is dry-run. It does not mutate Convex; it writes one JSONL line
per organization to `.context/claude-ai-research-sample.jsonl` for manual
review:

```bash
pnpm run claude-ai-research -- --limit=25 --concurrency=3 --timeout-ms=180000
```

Write modes are identical to the Codex runner:

- `--enqueue-crawl` also enqueues high/medium crawl candidates and advances the
  organization to `searched` when crawl jobs are created, otherwise
  `ai_confirmed`.
- `--promote-ready` promotes high-confidence results with a correct website,
  at least two identity evidence items, and a mission or one-sentence summary.
  It also promotes medium-confidence results when they have at least three
  identity evidence items, an official-site candidate for the confirmed domain,
  and hard identity evidence such as EIN, street address, or name plus
  city/state. Non-promoted results follow the enqueue/fallback path.

Authentication is auto-detected exactly like `claude-ai-confirm`: set
`ANTHROPIC_API_KEY` for metered API billing, or leave it unset to use the local
`claude login` subscription session. It also requires `CONVEX_URL` and
`LOCAL_AI_OPERATOR_TOKEN` to list candidates and to use commit modes.

Note: the SDK's native `outputFormat: json_schema` mode is only enforced on the
`ANTHROPIC_API_KEY` auth path. The Max subscription path ignores it and returns
free-form text, which the runner parses and validates with the shared Zod schema
as a fallback. On API-key auth, `WebSearch`/`WebFetch` are metered.

Optional environment overrides:

- `CLAUDE_RESEARCH_MODEL` - defaults to `ANTHROPIC_MODEL` or `claude-sonnet-4-6`
- `CLAUDE_RESEARCH_TIMEOUT_MS` - defaults to `180000`
- `CLAUDE_RESEARCH_CONCURRENCY` - defaults to `3`
- `CLAUDE_RESEARCH_MAX_TURNS` - defaults to `30`

## Components

- **`src/scripts/createOrgsByStateConvex.ts`** - Reads IRS CSV, filters eligible orgs, writes JSONL for `npx convex import`
- **`src/scripts/transformToConvex.ts`** - Transforms raw data exports into Convex table JSONL files
- **`src/scripts/localAiConfirm.ts`** - Runs the local Ollama confirmation workflow against Convex
- **`src/scripts/claudeAiConfirm.ts`** - Runs the concurrent Claude Agent SDK confirmation workflow against Convex (subscription or API key)
- **`src/scripts/codexAiConfirm.ts`** - Runs the concurrent Codex SDK confirmation workflow against Convex (login session or API key)
- **`src/scripts/codexAiResearch.ts`** - Runs live-search Codex research for created orgs with dry-run and guarded commit modes
- **`src/scripts/claudeAiResearch.ts`** - Runs live-search Claude Agent SDK research for created orgs with dry-run and guarded commit modes
- **`src/services/parseEoFile.ts`** - Core IRS CSV parser with code dictionary mapping (NTEE, activity, foundation, etc.)
- **`src/data/dataDictionaries/`** - IRS code reference data (10 JSON files)
- **`src/utils/`** - Shared utilities (slug generation, amount bucketing, text processing, logging)

## Data Sources

- [IRS EO File Downloads](https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf#regions)
- [IRS EO Bulk Data Downloads](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads)
- [NTEE Codes](https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes)
- [IRS Activity Codes](https://nccs.urban.org/publication/irs-activity-codes)
- [IRS EO File Documentation](https://www.irs.gov/pub/irs-tege/p4838.pdf)
