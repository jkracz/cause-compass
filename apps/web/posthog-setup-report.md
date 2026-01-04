# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into your Cause Compass Next.js application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` for Next.js 16.1.1 app router
- **Server-side tracking** via `posthog-node` for server actions
- **Error tracking** with `captureException` calls throughout the application
- **User identification** on the server side when users complete onboarding
- **14 custom events** tracking the complete user journey from onboarding through organization discovery and engagement

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `onboarding_started` | User begins the onboarding questionnaire to discover nonprofits aligned with their values | `src/components/onboarding-flow.tsx` |
| `onboarding_question_answered` | User answers an individual onboarding question about their values/preferences | `src/components/onboarding-flow.tsx` |
| `onboarding_completed` | User completes all onboarding questions and their preferences are saved (key conversion event) | `src/components/onboarding-flow.tsx` |
| `location_permission_granted` | User grants location permission during onboarding for local nonprofit discovery | `src/components/onboarding-flow.tsx` |
| `location_permission_denied` | User denies or skips location permission during onboarding | `src/components/onboarding-flow.tsx` |
| `organization_liked` | User swipes right/likes an organization (key engagement event) | `src/components/discover.tsx` |
| `organization_skipped` | User swipes left/skips an organization during discovery | `src/components/discover.tsx` |
| `discovery_session_completed` | User finishes viewing all recommended organizations in a discovery session | `src/components/discover.tsx` |
| `organization_details_viewed` | User opens the modal to view full organization details | `src/components/my-causes.tsx` |
| `organization_removed` | User removes a previously liked organization from their saved causes | `src/components/my-causes.tsx` |
| `organization_website_clicked` | User clicks to visit an organization's external website (key conversion event) | `src/components/organization-modal.tsx` |
| `organization_shared` | User shares an organization link with others | `src/components/organization-modal.tsx` |
| `voice_recording_started` | User starts recording a voice response during onboarding | `src/components/voice-recorder.tsx` |
| `journey_reset` | User clicks to reset their journey and start over (potential churn indicator) | `src/components/start-over-button.tsx` |
| `server_preferences_saved` | Server-side event when user preferences are saved to database | `src/lib/actions/user.ts` |

## Files Created/Modified

### New Files
- `instrumentation-client.ts` - Client-side PostHog initialization
- `src/lib/posthog-server.ts` - Server-side PostHog client
- `.env` - Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`

### Modified Files
- `src/components/onboarding-flow.tsx` - Added onboarding funnel events
- `src/components/discover.tsx` - Added organization discovery events
- `src/components/my-causes.tsx` - Added organization management events
- `src/components/organization-modal.tsx` - Added website click and share events
- `src/components/voice-recorder.tsx` - Added voice recording event
- `src/components/start-over-button.tsx` - Added churn indicator event
- `src/lib/actions/user.ts` - Added server-side identification and tracking

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/277352/dashboard/969596) - Core analytics dashboard for Cause Compass

### Insights
- [Onboarding Funnel](https://us.posthog.com/project/277352/insights/OYZPspRa) - Tracks users through the onboarding process from start to completion
- [Discovery to Engagement Funnel](https://us.posthog.com/project/277352/insights/MgHTkjaz) - Tracks users from discovery session through liking organizations and visiting websites
- [Organization Engagement Over Time](https://us.posthog.com/project/277352/insights/gJ8ETRBL) - Weekly trend of organization likes, skips, and website clicks
- [Churn Indicators](https://us.posthog.com/project/277352/insights/djlcvi54) - Tracks journey resets and organization removals as potential churn signals
- [Discovery Session Completion](https://us.posthog.com/project/277352/insights/Va75gGIz) - Tracks how many users complete their discovery sessions

## Configuration

PostHog is configured with the following environment variables in `.env`:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_GpZPMXvXjRGzeIYHw0lXttCsuooGZLooU2C6pbPDRCf
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Make sure to add these to your production environment (e.g., Vercel, Netlify) as well.
