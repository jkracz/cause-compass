# Cause Compass Launch Checklist

This checklist focuses on must-have work before a Product Hunt launch.

## 0. Pipeline Health Snapshot (Done First)

- [ ] Run health summary query:
  - `npx convex run pipelineHealth:getSummary`
- [ ] Run with custom stale threshold when needed:
  - `npx convex run pipelineHealth:getSummary '{"staleHours": 48}'`
- [ ] Capture current values in a note (date + output summary):
  - `byStage.created.total`
  - `byStage.searched.total`
  - `byStage.crawled.total`
  - `byStage.ai_confirmed.total`
  - `byStage.ready.total`
  - `batchJobs.processing/completed/failed`
  - `batchJobs.lastSuccessfulBatchAt`
  - `batchJobs.lastFailedBatchAt`

## 1. Restore End-to-End Pipeline Flow

- [ ] Ensure there is an automated path for:
  - `created -> searched -> crawled -> ai_confirmed -> ready`
- [ ] Resolve crawler gap (currently outside Convex cron flow).
- [ ] Add explicit stage finalization logic for:
  - `ai_confirmed -> ready`
- [ ] Verify no stage backlog grows day-over-day.

Success criteria:

- [ ] `created` and `searched` counts trend down after each run window.
- [ ] `ready` count trends up consistently.

## 2. Migrate Crawling to Convex-Orchestrated Worker (Docker on TrueNAS)

- [ ] Use Convex as control plane (queue/claim/retry/status).
- [ ] Run Playwright crawler in a Docker worker on TrueNAS.
- [ ] Add worker heartbeat + retry-on-timeout.
- [ ] Persist crawl results directly to Convex tables.
- [ ] Add fail reason fields for crawl diagnostics.

Success criteria:

- [ ] Worker can run continuously without manual script execution.
- [ ] Crawl failures are visible and retryable.
- [ ] Mean crawl completion time is measurable.

## 3. Recommendation Quality Must-Haves

- [ ] Replace generic discover query with user-aware scoring.
- [ ] Use existing user preferences:
  - causes, helpMethod, changeScope, location
- [ ] Use organization signals:
  - nteeMajor, keywords, geographicFocus, mission/whySupport presence
- [ ] Return "why this match" explanation per result.

Success criteria:

- [ ] Personalized feed differs by user profile.
- [ ] Like rate improves vs current baseline.

## 4. Search Relevance Must-Haves

- [ ] Expand search beyond org name:
  - mission
  - keywords
  - activities
  - geographic focus
- [ ] Keep current fast name search as fallback.

Success criteria:

- [ ] Users can discover unknown orgs via intent phrases.
- [ ] Fewer "no results" searches on meaningful queries.

## 5. Trust and Data Quality Signals

- [ ] Show verification/freshness on profiles:
  - last updated date
  - website confidence/validation state
  - available action links (website/donation/social)
- [ ] Flag stale records for refresh workflows.

Success criteria:

- [ ] Users can understand why profile data is trustworthy.
- [ ] Stale data percentage decreases over time.

## 6. Launch-Critical UX and Reliability Fixes

- [ ] Fix full reset flow so "Start Over" clears backend user data.
- [ ] Ensure onboarding -> discover -> save causes -> revisit flow is stable.
- [ ] Add friendly empty states when recommendations are unavailable.

Success criteria:

- [ ] No broken loop in primary user journey.
- [ ] No misleading state after reset.

## 7. Measurement and Launch Guardrails

- [ ] Track north-star metric:
  - `organization_website_clicked / onboarding_completed`
- [ ] Add operational metrics:
  - stage backlog by day
  - crawl success rate
  - batch failure rate
  - median data age
- [ ] Define launch readiness thresholds.

Suggested launch gates:

- [ ] Pipeline running continuously for 7 days.
- [ ] `ready` inventory above minimum target.
- [ ] No critical blocker in onboarding/discovery/action flow.

## 8. Claude Code Skill (Optional Accelerator, Not Primary Pipeline)

- [ ] Create skill for targeted recrawls and failure triage.
- [ ] Keep always-on crawling in Docker worker as source of truth.
- [ ] Use skill for exceptional/manual operations only.

Success criteria:

- [ ] Skill reduces ops time without becoming production dependency.
