# PostHog Analytics Integration

This document describes the PostHog analytics integration for Cause Compass, including setup, architecture, and tracked events.

## Overview

Cause Compass uses PostHog for product analytics, user tracking, and error monitoring. The integration is client-side only.

### Architecture

- **Client-side**: components import `posthog-js` directly for browser-based tracking
- **Identity**: `src/components/app-session-provider.tsx` identifies anonymous guest sessions and authenticated users
- **Error tracking**: selected client error paths call `posthog.captureException`

## Tracked Events

### Account Events

| Event Name        | Description             | Location                                  |
| ----------------- | ----------------------- | ----------------------------------------- |
| `account_created` | User creates an account | `src/components/app-session-provider.tsx` |

### Discovery Events

| Event Name                    | Description                                 | Location                                                               |
| ----------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `recommendation_impression`   | Organization appears in the ranked feed     | `src/components/discover.tsx`                                          |
| `organization_liked`          | User likes an organization (key engagement) | `src/components/discover.tsx`, `src/components/organization-modal.tsx` |
| `organization_skipped`        | User skips an organization                  | `src/components/discover.tsx`                                          |
| `discovery_session_completed` | User finishes viewing all organizations     | `src/components/discover.tsx`                                          |

### Organization Management Events

| Event Name                     | Description                                   | Location                                                                                                   |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `organization_details_viewed`  | User opens organization details modal         | `src/components/discover.tsx`, `src/components/discovery-home-content.tsx`, `src/components/my-causes.tsx` |
| `organization_removed`         | User removes a saved organization             | `src/components/organization-modal.tsx`                                                                    |
| `organization_website_clicked` | User clicks to visit website (key conversion) | `src/components/organization-modal.tsx`                                                                    |
| `organization_donate_clicked`  | User clicks to visit donation page            | `src/components/organization-modal.tsx`                                                                    |
| `organization_shared`          | User shares an organization link              | `src/components/organization-modal.tsx`                                                                    |

### Browse Events

| Event Name         | Description                 | Location                                    |
| ------------------ | --------------------------- | ------------------------------------------- |
| `search_initiated` | User starts a browse search | `src/components/discovery-home-content.tsx` |

## Files

### Instrumented Components

- `src/components/discover.tsx` - Discovery session, details, like, skip, and impression tracking
- `src/components/discovery-home-content.tsx` - Home browse, search, and details tracking
- `src/components/app-session-provider.tsx` - Account creation and identity tracking
- `src/components/my-causes.tsx` - Organization management tracking
- `src/components/organization-modal.tsx` - Organization engagement tracking

## Dashboards and Insights

### Dashboard

- [Analytics Basics](https://us.posthog.com/project/277352/dashboard/969596) - Core analytics dashboard

### Current Key Metrics

- Account creation: `account_created`
- Saved organizations: `organization_liked`
- Downstream action: `organization_website_clicked` and `organization_donate_clicked`
- Retention/churn signal: `organization_removed`

## Best Practices

1. **Event naming**: Use snake_case for event names
2. **Error filtering**: Only track unexpected errors, not user-initiated cancellations
3. **Event timing**: Capture conversion events before navigation when a click changes the page
4. **Event properties**: Include relevant context (organization IDs, recommendation metadata, etc.)
