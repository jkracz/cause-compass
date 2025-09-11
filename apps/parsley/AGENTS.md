# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Linting
pnpm run lint

# Main entry point
pnpm run start

# Data processing pipeline scripts
pnpm run create-profiles --state=ca    # Process IRS data for specific state
pnpm run search-orgs                   # Google search for organizations
pnpm run crawl-sites                   # Crawl websites from search results
pnpm run generate-batch-confirmation-file  # Create AI batch processing files
pnpm run parse-batch-responses         # Process AI batch responses
pnpm run confirm-with-local           # Local confirmation processing
pnpm run backfill-website-fields     # Backfill missing website data
```

## Architecture Overview

This is a comprehensive nonprofit data intelligence platform with a multi-stage data processing pipeline:

### Core Data Flow
1. **IRS Data Import** → Raw EO CSV files processed into MongoDB
2. **Web Discovery** → Google Search API finds organization websites  
3. **Website Crawling** → Playwright/Crawlee extracts content and metadata
4. **AI Analysis** → OpenAI batch processing enriches organization profiles
5. **Data Validation** → AI responses validated and structured into final profiles

### Key Components

**BatchManager** (`src/services/batchManager.ts`)
- Orchestrates the entire AI batch processing workflow
- Manages OpenAI batch job lifecycle (upload → process → download → parse)
- Automatically chains batch jobs for continuous processing
- Handles error recovery and job state persistence

**Data Pipeline Scripts** (`src/scripts/`)
- `createOrgsByState.ts`: Processes IRS EO CSV files with business logic filtering
- `googleSearchOrgs.ts`: Multi-API key Google search for organization discovery
- `parseSearchResults.ts`: Website crawling using Playwright
- `generateBatchConfirmationFile.ts`: Creates structured AI prompts for batch processing
- `parseBatchResponses.ts`: Processes and validates AI batch responses

**Services Layer** (`src/services/`)
- `mongo.ts`: MongoDB operations and schema management
- `openAi.ts`: OpenAI API integration and batch management
- `crawler.ts`: Website crawling infrastructure
- `googleSearch.ts`: Google Custom Search API integration

### URL Discovery & Filtering System

The platform uses sophisticated URL filtering in `src/utils/parseUtils.ts`:

**Smart Subdomain Filtering** (`hasUnwantedSubdomain`):
- Allows: `donate.org.com`, `events.nonprofit.org`, `secure.charity.org`
- Filters: `blog.*`, `shop.*`, `store.*`, `mail.*`, `staging.*`, `dev.*`, `test.*`

**URL Scoring Algorithm** (`scoreUrl`):
- Exact org name match: +100 points
- Acronym match: +50 points
- Individual keyword matches: +20 points each
- `.org` domain: +20 points

**URL Selection** (`findBestUrls`):
- Filters social media platforms and unwanted subdomains
- Deduplicates by normalized domain
- Returns top 20 URLs sorted by relevance score
- Optimizes crawling efficiency and reduces compute costs

### Data Structure

The central `TaxExemptOrganization` interface (`src/types.ts`) combines:
- IRS EO data (EIN, name, address, classification codes)
- Web discovery results (search results, crawled content)
- AI-enriched fields (mission, activities, social media, donation URLs)
- Processing metadata (batch IDs, timestamps)

### Technology Stack
- **Backend**: TypeScript, Node.js
- **Database**: MongoDB with Mongoose
- **Web Crawling**: Playwright, Crawlee
- **AI Processing**: OpenAI GPT-4 Batch API
- **Search**: Google Custom Search API
- **Utilities**: Winston logging, Zod validation

### Environment Requirements
The application requires these environment variables:
- MongoDB connection string
- OpenAI API key
- Multiple Google Search API keys
- Batch processing configuration

### Data Sources
- IRS EO CSV files named `eo_{state}.csv` in the `data/raw/` directory
- Google Search results for organization discovery
- Crawled website content and metadata
- AI-generated organization profiles and enrichment data