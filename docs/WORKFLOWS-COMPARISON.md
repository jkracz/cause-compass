# GitHub Actions vs Convex Workflows: Analysis for Cause Compass

## Executive Summary

This document compares GitHub Actions and Convex Workflows for batch processing and scheduled tasks in the Cause Compass application. Currently, the project uses **both approaches**:

- **GitHub Actions**: Hourly batch processing for nonprofit data enrichment (parsley app)
- **Convex Crons**: Daily organization search via Google Search API

This analysis evaluates whether to consolidate on one platform or continue with the hybrid approach.

---

## Current Implementation

### GitHub Actions Workflow (`.github/workflows/batch-processing.yml`)

**Purpose**: Process batches of nonprofit data from MongoDB using OpenAI API

| Aspect | Details |
|--------|---------|
| **Trigger** | Scheduled hourly (`0 * * * *`) + manual dispatch |
| **Runtime** | Ubuntu latest on GitHub infrastructure |
| **Duration** | Variable (depends on BATCH_SIZE) |
| **Data Source** | MongoDB (parsley app still uses Mongoose) |
| **External APIs** | OpenAI API |
| **Artifacts** | Uploads batch files with 7-day retention |
| **Environment** | `MONGO_USER`, `MONGO_PASSWORD`, `OPENAI_API_KEY`, `BATCH_SIZE` |

```yaml
# Key steps
- Checkout repository
- Install pnpm & Node.js 20.20.0
- Install dependencies
- Build @cause/types
- Run processBatch.ts script
- Upload artifacts
```

### Convex Cron Job (`packages/backend/convex/crons.ts`)

**Purpose**: Daily organization search via Google Search API

| Aspect | Details |
|--------|---------|
| **Trigger** | Daily at midnight UTC |
| **Runtime** | Convex serverless infrastructure |
| **Duration** | Limited by Convex action timeout (10 min default) |
| **Data Source** | Convex database |
| **External APIs** | Google Search API (4 keys, 100 searches each = 400/day) |
| **Environment** | `ENABLE_SEARCH_CRON`, `GOOGLE_SEARCH_*` keys |

```typescript
crons.daily(
  "search-organizations",
  { hourUTC: 0, minuteUTC: 0 },
  internal.searchOrgs.scheduledSearchOrganizations
);
```

---

## Feature Comparison

| Feature | GitHub Actions | Convex Workflows |
|---------|---------------|------------------|
| **Scheduling** | Cron syntax (minute granularity) | hourly, daily, weekly, monthly, or interval |
| **Manual Trigger** | `workflow_dispatch` | Dashboard or `npx convex run` |
| **Max Duration** | 6 hours (job) / 72 hours (workflow) | 10 min (action) / 7 days (durable workflow) |
| **Compute Cost** | 2,000 min/month free (public) | Included in Convex plan |
| **Secrets Management** | Repository/org secrets | Convex Dashboard environment variables |
| **Artifacts** | Upload/download with retention | File storage or external services |
| **Logging** | Workflow logs with retention | Convex Dashboard logs |
| **Retries** | Manual re-run or workflow logic | Built-in for mutations, manual for actions |
| **Concurrency** | Configurable per workflow | Automatic (Convex manages) |
| **Database Access** | External connection required | Native Convex access |
| **Cold Start** | Full environment setup (~1-2 min) | Minimal (~100ms) |

---

## Strengths & Weaknesses

### GitHub Actions

**Strengths:**
- Long-running jobs (up to 6 hours per job)
- Full control over execution environment
- Rich ecosystem of reusable actions
- Artifact storage with configurable retention
- No additional service required
- Better for heavy computational tasks
- Familiar CI/CD tooling

**Weaknesses:**
- Cold start time (checkout, install, build)
- Separate from application runtime
- MongoDB connection overhead
- Limited free minutes for private repos
- No native database integration
- Debugging requires full re-runs

### Convex Crons/Actions

**Strengths:**
- Native database access (no connection setup)
- Minimal cold start
- Same codebase as application
- Integrated logging and monitoring
- Type-safe with generated API
- Easy manual testing (`npx convex run`)
- Automatic retries for mutations

**Weaknesses:**
- 10-minute action timeout (without workflow component)
- Must handle rate limiting manually
- Limited to JavaScript/TypeScript
- Less control over execution environment
- File handling requires Convex File Storage
- Learning curve for Convex-specific patterns

---

## Use Case Recommendations

### When to Use GitHub Actions

1. **Long-running batch jobs** (> 10 minutes)
   - Current parsley batch processing fits this well
   - Heavy data transformations
   - Large file processing

2. **Multi-step workflows with artifacts**
   - CI/CD pipelines
   - Build and deploy processes
   - Report generation with file outputs

3. **External system integrations**
   - When you need specific OS packages
   - Docker-based workflows
   - Legacy system connections

4. **One-time or infrequent migrations**
   - Large data migrations
   - Maintenance scripts

### When to Use Convex Workflows

1. **Database-centric operations** (< 10 minutes)
   - Current Google Search job is a good example
   - Data enrichment pipelines
   - Scheduled cleanups

2. **Real-time adjacent tasks**
   - Tasks that need to update UI state
   - Operations that trigger reactivity

3. **High-frequency scheduling**
   - Sub-hourly intervals
   - Tasks that benefit from low latency

4. **When you need Convex Durable Workflows** (new feature)
   - Multi-step, resumable workflows
   - Tasks that can span 7 days
   - Workflows with sleep/wait states

---

## Convex Durable Workflows (Emerging Option)

Convex recently released **Workflow component** for long-running, durable workflows:

```typescript
// Example: Multi-step data processing workflow
export const processOrganization = workflow.define({
  args: { orgId: v.id("organizations") },
  handler: async (step, args) => {
    // Step 1: Fetch data
    const org = await step.runQuery(internal.orgs.get, { id: args.orgId });

    // Step 2: Call external API
    const enrichment = await step.runAction(internal.apis.enrich, { name: org.name });

    // Step 3: Save results
    await step.runMutation(internal.orgs.update, { id: args.orgId, data: enrichment });
  },
});
```

**Key features:**
- Can run for up to 7 days
- Automatic checkpointing and resumption
- Survives server restarts
- Integrates with Convex scheduler

This could replace GitHub Actions for many batch processing scenarios.

---

## Migration Considerations

### Option A: Keep Hybrid Approach (Recommended for now)

**Rationale:** Current architecture works well for each use case.

| Workload | Platform | Reason |
|----------|----------|--------|
| Parsley batch processing | GitHub Actions | Long-running, MongoDB-dependent, artifact output |
| Google Search job | Convex Crons | Database-centric, fits within time limits |
| Future Convex data jobs | Convex Crons | Native database access |

### Option B: Consolidate to Convex (Future consideration)

**Prerequisites:**
1. Complete MongoDB to Convex migration for parsley
2. Evaluate Convex Workflow component for long-running tasks
3. Implement file handling via Convex File Storage

**Benefits:**
- Unified codebase and monitoring
- No external CI/CD dependency for data processing
- Type-safe, integrated workflows

### Option C: Consolidate to GitHub Actions (Not recommended)

Would require:
- Moving all scheduled jobs to GitHub Actions
- Adding Convex client setup to GitHub Actions
- Losing native database access benefits

---

## Cost Analysis

### GitHub Actions
- **Public repos**: 2,000 free minutes/month
- **Private repos**: 500 free minutes/month, then $0.008/min (Linux)
- **Artifacts**: 500 MB storage, $0.25/GB after

### Convex
- **Free tier**: 2GB database, 1M function calls
- **Pro tier**: $25/month, includes more resources
- **Actions**: Count toward function calls

**For Cause Compass (estimated):**
- GitHub Actions: ~30 runs/day × ~5 min = 150 min/day = ~4,500 min/month
- Convex: Daily cron with ~400 API calls = minimal cost impact

---

## Recommendations

### Short-term (Current State)

1. **Keep the hybrid approach** - it matches the current architecture well
2. **Monitor GitHub Actions usage** - track minutes consumption
3. **Complete Convex migration** for web app data layer

### Medium-term (Post-migration)

1. **Evaluate Convex Workflow component** for parsley batch processing
2. **Prototype** batch processing as Convex durable workflow
3. **Compare performance** and cost with GitHub Actions

### Long-term (Fully Convex)

1. **Migrate parsley to Convex** if workflow component meets requirements
2. **Consolidate all scheduled jobs** in Convex
3. **Use GitHub Actions only** for CI/CD (tests, deploys)

---

## References

- [Convex Cron Jobs Documentation](https://docs.convex.dev/scheduling/cron-jobs)
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions)
- [Convex Workflow Component](https://www.convex.dev/components/workflow)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Usage Limits](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration)

---

*Last updated: January 2025*
*Document location: `/docs/WORKFLOWS-COMPARISON.md`*
