# PostHog Analytics Integration

This document describes the PostHog analytics integration for Cause Compass, including setup, architecture, and tracked events.

## Overview

Cause Compass uses PostHog for product analytics, user tracking, and error monitoring. The integration includes both client-side and server-side tracking to capture the complete user journey.

### Architecture

- **Client-side**: Initialized via `instrumentation-client.ts` using `posthog-js` for browser-based tracking
- **Server-side**: Uses `posthog-node` for server actions and API routes
- **Error tracking**: Automatic exception capture with filtering for expected user behaviors

## Tracked Events

### Discovery Events

| Event Name                    | Description                                 | Location                      |
| ----------------------------- | ------------------------------------------- | ----------------------------- |
| `organization_liked`          | User likes an organization (key engagement) | `src/components/discover.tsx` |
| `organization_skipped`        | User skips an organization                  | `src/components/discover.tsx` |
| `discovery_session_completed` | User finishes viewing all organizations     | `src/components/discover.tsx` |

### Organization Management Events

| Event Name                     | Description                                   | Location                                |
| ------------------------------ | --------------------------------------------- | --------------------------------------- |
| `organization_details_viewed`  | User opens organization details modal         | `src/components/my-causes.tsx`          |
| `organization_removed`         | User removes a saved organization             | `src/components/my-causes.tsx`          |
| `organization_website_clicked` | User clicks to visit website (key conversion) | `src/components/organization-modal.tsx` |
| `organization_shared`          | User shares an organization link              | `src/components/organization-modal.tsx` |

### Other Events

| Event Name      | Description                                 | Location                               |
| --------------- | ------------------------------------------- | -------------------------------------- |
| `journey_reset` | User resets their journey (churn indicator) | `src/components/start-over-button.tsx` |

## Implementation Details

### Event Flushing

Server-side events are flushed before redirects to prevent data loss:

```typescript
await flushPostHog(); // Ensures events are sent before redirect
```

## Files

### Instrumented Components

- `src/components/discover.tsx` - Discovery session tracking
- `src/components/my-causes.tsx` - Organization management tracking
- `src/components/organization-modal.tsx` - Organization engagement tracking
- `src/components/start-over-button.tsx` - Churn indicator tracking

## Dashboards and Insights

### Dashboard

- [Analytics Basics](https://us.posthog.com/project/277352/dashboard/969596) - Core analytics dashboard

### Key Insights

- [Discovery to Engagement Funnel](https://us.posthog.com/project/277352/insights/MgHTkjaz) - Discovery session to website clicks
- [Organization Engagement Over Time](https://us.posthog.com/project/277352/insights/gJ8ETRBL) - Weekly engagement trends
- [Churn Indicators](https://us.posthog.com/project/277352/insights/djlcvi54) - Journey resets and organization removals
- [Discovery Session Completion](https://us.posthog.com/project/277352/insights/Va75gGIz) - Session completion rates

## Best Practices

1. **Event naming**: Use snake_case for event names
2. **Error filtering**: Only track unexpected errors, not user-initiated cancellations
3. **Event timing**: Capture conversion events before redirects to prevent data loss
4. **Event properties**: Include relevant context (organization IDs, recommendation metadata, etc.)
