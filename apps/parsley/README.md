# Parsley - Nonprofit Data Intelligence Platform

A comprehensive data processing and intelligence platform for nonprofit organizations, built to import, enrich, and analyze tax-exempt organization data from multiple sources.

## Overview

Parsley is a sophisticated data pipeline that transforms raw IRS EO (Exempt Organizations) data into rich, actionable intelligence about nonprofit organizations. The platform combines data processing, web crawling, AI-powered analysis, and batch processing to create comprehensive nonprofit profiles.

## Key Features

- **Data Import & Processing**: Efficiently processes IRS EO CSV files with smart filtering
- **Web Crawling & Scraping**: Automated website crawling using Playwright and Crawlee
- **AI-Powered Analysis**: OpenAI integration for intelligent data validation and enrichment
- **Batch Processing**: Scalable batch operations for large-scale data processing
- **Google Search Integration**: Multi-API key search capabilities for organization discovery
- **MongoDB Integration**: Robust data storage with optimized indexing
- **Comprehensive Logging**: Detailed metrics and error reporting throughout the pipeline

## Core Components

### Data Processing Pipeline

1. **IRS Data Import** (`createOrgsByState.ts`)
   - Parses and filters IRS EO files by state
   - Applies business logic to exclude ineligible organizations
   - Generates unique IDs and URL slugs
   - Batch inserts into MongoDB

2. **Web Search & Discovery** (`googleSearchOrgs.ts`)
   - Searches for organizations using multiple Google API keys
   - Queries combine organization name, city, and state
   - Stores search results for further processing

3. **Website Crawling** (`crawler.ts`)
   - Automated web scraping using Playwright
   - Extracts social media links, donation forms, contact info
   - Captures page content and metadata
   - Handles multiple pages per organization

### AI-Powered Analysis

4. **Batch Confirmation** (`generateBatchConfirmationFile.ts`)
   - Creates structured prompts for AI analysis
   - Validates website accuracy and organization details
   - Generates mission statements and unique traits
   - Uses OpenAI's batch processing API

5. **Response Processing** (`parseBatchResponses.ts`)
   - Processes AI batch responses
   - Validates and structures AI-generated content
   - Updates organization profiles with enriched data

### Batch Management

6. **Batch Manager** (`batchManager.ts`)
   - Orchestrates the entire batch processing workflow
   - Handles file uploads, status monitoring, and result downloads
   - Manages job lifecycle and error recovery
   - Automatically starts new batches when ready

## Scripts

### Data Import
```bash
# Process IRS data for a specific state
pnpm run create-profiles --state=ca
```

### Web Discovery
```bash
# Search for organizations using Google APIs
pnpm run search-orgs

# Crawl websites based on search results
pnpm run crawl-sites
```

### AI Analysis
```bash
# Generate batch confirmation files for AI processing
pnpm run generate-batch-confirmation-file

# Process AI batch responses
pnpm run parse-batch-responses

# Local confirmation processing
pnpm run confirm-with-local
```

### System Management
```bash
# Start the main processing loop
pnpm run start

# Clean up temporary files
pnpm run cleanup
```

## Data Flow

1. **Import**: IRS EO files → Filtered organizations → MongoDB
2. **Discovery**: Organizations → Google Search → Search results
3. **Crawling**: Search results → Website crawling → Page content
4. **Analysis**: Crawled content → AI batch processing → Enriched profiles
5. **Validation**: AI responses → Structured data → Updated profiles

## Technology Stack

- **Backend**: Node.js, TypeScript
- **Database**: MongoDB
- **Web Crawling**: Playwright, Crawlee
- **AI/ML**: OpenAI GPT-4, Batch API
- **Search**: Google Custom Search API
- **Data Processing**: CSV parsing, JSON processing
- **Logging**: Winston
- **Validation**: Zod schemas

## Setup

1. **Install dependencies**: `pnpm install`
2. **Environment variables**: Create `.env` file with:
   - MongoDB connection string
   - OpenAI API key
   - Google Search API keys
   - Batch processing configuration
3. **Data preparation**: Place IRS EO CSV files in data directory
4. **Database setup**: Ensure MongoDB is running and accessible

## Data Sources

- **IRS EO Files**: Named as `eo_{state}.csv` (e.g., `eo_ca.csv`)
- **Web Crawling**: Organization websites and social media
- **Google Search**: Organization discovery and validation
- **AI Analysis**: OpenAI-powered content generation and validation

## URL Discovery & Filtering

The platform uses a sophisticated URL filtering and scoring system to identify the most relevant websites for each organization:

### Smart Subdomain Handling
- **Allows useful subdomains**: `donate.org.com`, `events.nonprofit.org`, `secure.charity.org`
- **Filters unwanted subdomains**: `blog.*`, `shop.*`, `store.*`, `mail.*`, `staging.*`, `dev.*`, `test.*`
- **Preserves standard subdomains**: `www.*` and root domains

### URL Scoring Algorithm
The system scores URLs based on relevance to the organization:

1. **Exact org name match**: +100 points
2. **Acronym match**: +50 points  
3. **Individual keyword matches**: +20 points each
4. **Keyword at domain start**: +10 points additional
5. **`.org` domain**: +20 points

### Filtering Process
1. **Social Media Exclusion**: Removes LinkedIn, Facebook, Twitter, Instagram, YouTube, etc.
2. **Subdomain Filtering**: Excludes unwanted subdomains while preserving useful ones
3. **Deduplication**: Removes duplicate domains using normalized domain names
4. **Scoring & Ranking**: Sorts by relevance score and returns top 20 URLs
5. **Crawling Optimization**: Limits to most promising sites to reduce compute costs

This approach ensures high-quality website discovery while minimizing crawling time and computational overhead.

## Architecture

The platform follows a modular architecture with:
- **Scripts**: Standalone processing modules
- **Utils**: Shared utilities and helpers
- **Crawlee**: Web crawling infrastructure
- **DB**: Database operations and schemas
- **Types**: TypeScript type definitions

Each component is designed for scalability and can be run independently or as part of the complete pipeline.
