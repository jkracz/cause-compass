# Cause Compass Web

Next.js 16 App Router frontend for Cause Compass. The app uses Convex for data, Better Auth for sign-in, Tailwind CSS 4, and PostHog for client-side analytics.

## Scripts

Run commands from `apps/web` or through the root workspace filter.

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

From the repo root:

```bash
pnpm --filter web dev
pnpm --filter web lint
pnpm --filter web typecheck
```

## Local Configuration

Start from `.env.example`:

```bash
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
NEXT_PUBLIC_SHOO_BASE_URL=...
```

`NEXT_PUBLIC_CONVEX_URL` is the Convex deployment URL used by the React client. `NEXT_PUBLIC_CONVEX_SITE_URL` is the Convex site URL used by the server auth helper. The local browser origin must also match the Convex `SITE_URL` environment variable, normally `http://localhost:3000`.

## Auth And Sessions

Cause Compass uses anonymous guest sessions plus Better Auth sign-in through Convex.

- `src/proxy.ts` creates a browser-scoped `guestId` cookie.
- `src/app/ConvexClientProvider.tsx` reads that cookie server-side and passes it to the client.
- `src/components/app-session-provider.tsx` owns Better Auth session state, `ConvexBetterAuthProvider`, PostHog identity, and guest-to-account linking.
- Convex verifies Better Auth JWTs through the backend auth configuration in `packages/backend/convex/auth.config.ts`.

## Routes

- `/` - editorial discovery home
- `/discover` - swipe-style personalized discovery
- `/browse/[slug]` - browse category pages
- `/my-causes` - saved organizations
- `/faq`, `/privacy`, `/terms` - static support pages

Client components read and write Convex data through generated `api` references from `@cause/backend/convex/_generated/api`.
